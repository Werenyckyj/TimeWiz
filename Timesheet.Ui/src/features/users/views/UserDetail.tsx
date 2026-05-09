import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UsersRepository } from "../services/UsersRepository";
import type { User } from "../types/users.type";
import type { EditTsWeek, RawTsWeek, TsWeek } from "../../timesheets/types/tsWeek.type";
import type { Project } from "../../projects/types/projects.type";
import { ProjectsRepository } from "../../projects/services/ProjectsRepository";
import type { PaginatedResponse } from "../types/paginatedResponse.type";
import { EditableTable, type ColumnDef } from "../../../shared/components/EditableTable";
import { TimesheetRepository } from "../../timesheets/services/TimesheetRepository";
import type { TsEntry } from "../../../shared/types/tsEntry.type";

const getIsoDateForDay = (year: number, week: number, dayOfWeek: number) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const isoWeekStart = new Date(simple);

    if (dow <= 4) {
        isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }

    const targetDate = new Date(isoWeekStart);
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    targetDate.setDate(isoWeekStart.getDate() + offset);

    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export default function UserDetail() {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [userProjects, setUserProjects] = useState<Project[]>([]);
    const [userProjectTimesheets, setUserProjectTimesheets] = useState<{ [projectId: number]: PaginatedResponse<TsWeek> }>({});
    const userId = Number(id);

    useEffect(() => {
        async function fetchData() {
            if (!id || Number.isNaN(userId)) {
                setMessage("Invalid user id");
                return;
            }

            try {
                setMessage(null);

                const fetchedUser = await UsersRepository.getUser(userId);
                const fetchedProjects = await ProjectsRepository.getUserProjects(userId);

                setUser(fetchedUser);
                setUserProjects(fetchedProjects);

                const timesheetsEntries = await Promise.all(
                    fetchedProjects.map(async (project) => {
                        const timesheets = await UsersRepository.getUserProjectTimesheets(userId, project.id);
                        return [project.id, timesheets] as const;
                    })
                );

                setUserProjectTimesheets(Object.fromEntries(timesheetsEntries) as { [projectId: number]: PaginatedResponse<TsWeek> });
            } catch (error) {
                setMessage("Error fetching user details");
                console.error("Error fetching user details:", error);
            }
        }

        fetchData();
    }, [id, userId]);

    const sanitizeHours = (val: string | number | undefined): number => {
        if (val === null || val === undefined || val === '') return 0;

        const safeVal = String(val).replace(',', '.');
        let parsed = parseFloat(safeVal);

        if (isNaN(parsed)) return 0;
        if (parsed > 24) parsed = 24;
        if (parsed < 0) parsed = 0;

        return Number(parsed.toFixed(3));
    };

    const handleLoadMore = async (projectId: number) => {
        const currentData = userProjectTimesheets[projectId];
        if (!currentData) return;

        try {
            const nextPage = currentData.page + 1;

            const newResponse = await UsersRepository.getUserProjectTimesheets(userId, projectId, nextPage, 3);

            setUserProjectTimesheets(prev => ({
                ...prev,
                [projectId]: {
                    ...newResponse,
                    data: [...prev[projectId].data, ...newResponse.data]
                }
            }));
        } catch (error) {
            console.error("Failed to load more timesheets:", error);
            setMessage("Failed to load older records.");
        }
    };

    const handleEdit = async (row: RawTsWeek) => {
        try {
            setMessage("Saving...");

            let originalTs: TsWeek | undefined;
            let targetProjectId: number = 0;

            for (const pId in userProjectTimesheets) {
                const found = userProjectTimesheets[pId].data.find(ts => ts.id === row.id);
                if (found) {
                    originalTs = found;
                    targetProjectId = Number(pId);
                    break;
                }
            }

            if (!originalTs) {
                throw new Error("Original timesheet not found in state.");
            }

            const updatedEntries: TsEntry[] = [];
            const daysMap = [
                { dayNum: 1, val: sanitizeHours(row.Mo) },
                { dayNum: 2, val: sanitizeHours(row.Tu) },
                { dayNum: 3, val: sanitizeHours(row.We) },
                { dayNum: 4, val: sanitizeHours(row.Th) },
                { dayNum: 5, val: sanitizeHours(row.Fr) },
                { dayNum: 6, val: sanitizeHours(row.Sa) },
                { dayNum: 0, val: sanitizeHours(row.Su) },
            ];

            for (const { dayNum, val } of daysMap) {
                const existingEntry = originalTs.tsEntries?.find(e => new Date(e.workDate).getDay() === dayNum);

                if (existingEntry) {
                    updatedEntries.push({ ...existingEntry, hours: val });
                } else if (val > 0) {
                    const workDate = getIsoDateForDay(originalTs.year, originalTs.weekNumber, dayNum);
                    updatedEntries.push({
                        id: 0,
                        tsWeekId: originalTs.id,
                        workDate: new Date(workDate),
                        hours: val,
                        notes: ""
                    });
                }
            }

            const payload: EditTsWeek = {
                projectId: originalTs.project?.id || targetProjectId,
                userId: originalTs.userId,
                year: originalTs.year,
                weekNumber: originalTs.weekNumber,
                comment: originalTs.comment,
                status: originalTs.status,
                tsEntries: updatedEntries,
                daysInWeek: updatedEntries.length,
                startDate: updatedEntries.length > 0 ? String(updatedEntries[0].workDate).split('T')[0] : `${originalTs.year}-01-01`
            };

            await TimesheetRepository.editTimesheet(row.id, payload);

            const refreshedTimesheets = await UsersRepository.getUserProjectTimesheets(userId, targetProjectId);

            setUserProjectTimesheets(prev => ({
                ...prev,
                [targetProjectId]: refreshedTimesheets
            }));

            setMessage("Timesheet successfully updated.");
        } catch (error) {
            setMessage("Error editing timesheet." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    }

    const columns: ColumnDef<RawTsWeek>[] = [
        { header: 'Week', accessor: 'week', type: 'readonly' },
        { header: 'Mon', accessor: 'Mo', type: 'number' },
        { header: 'Tue', accessor: 'Tu', type: 'number' },
        { header: 'Wen', accessor: 'We', type: 'number' },
        { header: 'Thu', accessor: 'Th', type: 'number' },
        { header: 'Fri', accessor: 'Fr', type: 'number' },
        { header: 'Sat', accessor: 'Sa', type: 'number' },
        { header: 'Sun', accessor: 'Su', type: 'number' },
    ];

    const getRawData = (timesheets: TsWeek[]): RawTsWeek[] => {
        return timesheets.map(ts => {
            const getHoursForDay = (targetDayOfWeek: number) => {
                const entry = ts.tsEntries?.find(e => new Date(e.workDate).getDay() === targetDayOfWeek);
                if (!entry || entry.hours === undefined || entry.hours === null) return 0;
                return Number(parseFloat(String(entry.hours)).toFixed(3));
            };

            return {
                id: ts.id,
                week: `${ts.year}-W${String(ts.weekNumber).padStart(2, '0')}`,
                year: ts.year,
                Mo: getHoursForDay(1),
                Tu: getHoursForDay(2),
                We: getHoursForDay(3),
                Th: getHoursForDay(4),
                Fr: getHoursForDay(5),
                Sa: getHoursForDay(6),
                Su: getHoursForDay(0),
            };
        });
    }

    return (
        <div className="main-content"
            style={{ fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{user?.name} {user?.surname}</h2>
            </div>
            {message && (
                <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: message.includes("Error") ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                    {message}
                </div>
            )}

            {userProjects.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No projects assigned.</p>
            ) : (
                userProjects.map(project => {
                    const timesheetData = userProjectTimesheets[project.id];

                    return (
                        <div key={project.id} style={{ marginBottom: '2rem' }}>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>{project.name}</h3>
                            {timesheetData ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>

                                    <EditableTable<RawTsWeek>
                                        columns={columns}
                                        data={getRawData(timesheetData.data)}
                                        onEdit={handleEdit}
                                    />

                                    {timesheetData.page < timesheetData.totalPages && (
                                        <button
                                            onClick={() => handleLoadMore(project.id)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                backgroundColor: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderTop: 'none',
                                                borderBottomLeftRadius: '8px',
                                                borderBottomRightRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                transition: 'background-color 0.2s ease',
                                                marginTop: '-1px'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                        >
                                            Load 3 more ↓
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-secondary)' }}>Loading timesheets...</p>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}