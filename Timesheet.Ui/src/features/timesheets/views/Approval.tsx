import { useEffect, useState, useMemo, useCallback } from "react";
import { useTimesheet } from "../hooks/useTimesheet";
import type { TsWeek } from "../types/tsWeek.type";
import { EditableTable, type ColumnDef } from "../../../shared/components/EditableTable";
import type { User } from "../../users/types/users.type";
import { UsersRepository } from "../../users/services/UsersRepository";
import { useProjects } from "../../projects/hooks/useProjects";
import { Modal } from "../../../shared/components/Modal";
import { useAuth } from "../../auth/hooks/useAuth";
import { ProjectMembersRepository } from "../../projects/services/ProjectMembersRepository";

const toLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getDaysOfWeek = (year: number, week: number): Date[] => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const isoWeekStart = simple;
    if (dow <= 4) {
        isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(isoWeekStart);
        d.setDate(isoWeekStart.getDate() + i);
        days.push(d);
    }
    return days;
};

export default function Approval() {
    const { pending, getPendingTimesheets, editTimesheet } = useTimesheet();
    const { projects, getUserProjects } = useProjects();
    const [message, setMessage] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [timesheetToReject, setTimesheetToReject] = useState<TsWeek | null>(null);
    const [rejectComment, setRejectComment] = useState("");
    const { user } = useAuth();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await getUserProjects(Number(user?.nameid));
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        fetchInitialData();
    }, [getUserProjects, user?.nameid]);

    useEffect(() => {
        const fetchManagedProjects = async () => {
            try {
                const managedProjects = await Promise.all(
                    (projects.data || []).map(async (project) => {
                        const managers = await ProjectMembersRepository.getProjectManagers(project.id);
                        return managers.some(m => m.id === Number(user?.nameid)) ? project : null;
                    })
                );

                const rawProjects = Array.isArray(managedProjects) ? managedProjects.filter(p => p) : [];
                rawProjects.forEach(project => {
                    if (project) getPendingTimesheets(Number(project.id)).catch(err => console.error(err));
                });
            } catch (error) {
                console.error("Failed to load managed projects", error);
            }
        };

        if (projects?.data && projects.data.length > 0) {
            fetchManagedProjects();
        }
    }, [projects, getPendingTimesheets, user?.nameid]);

    useEffect(() => {
        if (!pending || pending.length === 0) return;

        const fetchMissingUsers = async () => {
            const uniqueUserIds = [...new Set(pending.map(ts => ts.userId))];
            const missingIds = uniqueUserIds.filter(id => !users.some(u => u.id === id));

            if (missingIds.length > 0) {
                try {
                    const userPromises = missingIds.map(id => UsersRepository.getUser(id));
                    const newUsers = await Promise.all(userPromises);
                    setUsers(prev => [...prev, ...newUsers]);
                } catch (error) {
                    console.error("Failed to fetch specific users", error);
                }
            }
        };

        fetchMissingUsers();
    }, [pending, users]);

    const groupedPending = useMemo(() => {
        const groups: Record<number, { projectName: string, timesheets: TsWeek[] }> = {};

        pending.forEach(ts => {
            if (!groups[ts.project.id]) {
                groups[ts.project.id] = { projectName: ts.project.name, timesheets: [] };
            }
            groups[ts.project.id].timesheets.push(ts);
        });

        return groups;
    }, [pending]);

    const handleStatusChange = async (tsWeek: TsWeek, newStatus: "Approved" | "Rejected", commentOverride?: string) => {
        try {
            await editTimesheet(tsWeek.id, {
                projectId: tsWeek.project.id,
                userId: tsWeek.userId,
                year: tsWeek.year,
                weekNumber: tsWeek.weekNumber,
                comment: commentOverride !== undefined ? commentOverride : tsWeek.comment,
                status: newStatus,
                tsEntries: tsWeek.tsEntries,
                daysInWeek: tsWeek.tsEntries.length,
                startDate: tsWeek.tsEntries.length > 0
                    ? toLocalDateString(new Date(tsWeek.tsEntries[0].workDate))
                    : toLocalDateString(new Date(tsWeek.year, 0, 1))
            });
            setMessage(`Timesheet successfully ${newStatus.toLowerCase()}.`);

            await getPendingTimesheets(tsWeek.project.id);
        } catch (error) {
            setMessage(`Error updating timesheet: ${error instanceof Error ? error.message : ""}`);
        }
    };

    const handleRejectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!timesheetToReject) return;

        await handleStatusChange(timesheetToReject, "Rejected", rejectComment);

        setIsRejectModalOpen(false);
        setTimesheetToReject(null);
        setRejectComment("");
    };

    const renderDayCell = useCallback((tsWeek: TsWeek, dayIndex: number) => {
        const days = getDaysOfWeek(tsWeek.year, tsWeek.weekNumber);
        const targetDate = toLocalDateString(days[dayIndex]);

        const entryArray = Array.isArray(tsWeek.tsEntries) ? tsWeek.tsEntries : [];
        const entry = entryArray.find(e => {
            const entryDate = toLocalDateString(new Date(e.workDate));
            return entryDate === targetDate;
        });

        if (!entry) return <span style={{ color: '#94a3b8' }}>—</span>;
        else if (entry.hours === 0) return <span style={{ color: '#94a3b8' }}>0h</span>;

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold' }}>{entry.hours}h</span>
                {entry.notes && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{entry.notes}</span>}
            </div>
        );
    }, []);

    const columns: ColumnDef<TsWeek>[] = [
        {
            header: "Employee",
            accessor: "userId",
            type: "readonly",
            renderCell: (row) => {
                const user = users.find(u => u.id === row.userId);
                return user ? <strong>{user.name} {user.surname}</strong> : "Unknown";
            }
        },
        {
            header: "Week",
            accessor: "weekNumber",
            type: "readonly",
            renderCell: (row) => <span style={{ color: '#64748b' }}>W{row.weekNumber} / {row.year}</span>
        },
        ...(() => {
            const reference = pending[0];
            const days = reference ? getDaysOfWeek(reference.year, reference.weekNumber) : [];
            const formatDate = (date?: Date) =>
                date ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }).replace(/\//g, "-") : "--/--";

            return [
                { header: `${formatDate(days[0])} (Mon)`, accessor: "id", renderCell: (row: TsWeek) => renderDayCell(row, 0) },
                { header: `${formatDate(days[1])} (Tue)`, accessor: "id", renderCell: (row: TsWeek) => renderDayCell(row, 1) },
                { header: `${formatDate(days[2])} (Wed)`, accessor: "id", renderCell: (row: TsWeek) => renderDayCell(row, 2) },
                { header: `${formatDate(days[3])} (Thu)`, accessor: "id", renderCell: (row: TsWeek) => renderDayCell(row, 3) },
                { header: `${formatDate(days[4])} (Fri)`, accessor: "id", renderCell: (row: TsWeek) => renderDayCell(row, 4) },
                { header: `${formatDate(days[5])} (Sat)`, accessor: "id", renderCell: (row: TsWeek) => renderDayCell(row, 5) },
                { header: `${formatDate(days[6])} (Sun)`, accessor: "id", renderCell: (row: TsWeek) => renderDayCell(row, 6) },
            ] as ColumnDef<TsWeek>[];
        })(),
        {
            header: "Total",
            accessor: "id",
            renderCell: (row) => {
                const arr = Array.isArray(row.tsEntries) ? row.tsEntries : [];
                const sum = arr.reduce((acc, curr) => acc + (curr.hours || 0), 0);
                return <strong style={{ color: 'var(--text-primary)' }}>{sum}h</strong>;
            }
        },
        {
            header: "Action",
            accessor: "id",
            width: "200px",
            renderCell: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="success-button"
                        onClick={() => handleStatusChange(row, "Approved")}
                        style={{ padding: '6px 12px', backgroundColor: 'var(--success-2)', color: 'white', border: '1px solid var(--success-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        Approve
                    </button>
                    <button
                        className="reject-button"
                        onClick={() => {
                            setTimesheetToReject(row);
                            setRejectComment(row.comment || "");
                            setIsRejectModalOpen(true);
                        }}
                        style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid var(--reject-border)', color: 'var(--reject-text)', borderRadius: '4px', backgroundColor: 'var(--reject)' }}
                    >
                        Reject
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="main-content"
            style={{ fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Pending Approvals</h2>
            </div>

            {message && (
                <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: message.includes("Error") ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                    {message}
                </div>
            )}

            {Object.keys(groupedPending).length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    No pending timesheets require your approval.
                </div>
            ) : (
                Object.values(groupedPending).map(group => (
                    <div key={group.projectName} style={{ marginBottom: '3rem' }}>
                        <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
                            Project: {group.projectName}
                        </h3>

                        <EditableTable<TsWeek>
                            columns={columns}
                            isAdding={false}
                            setIsAdding={() => { }}
                            data={group.timesheets}
                        />
                    </div>
                ))
            )}
            <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Timesheet">
                <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Reason for Rejection *</label>
                        <textarea
                            required
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                minHeight: '100px',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                backgroundColor: 'var(--bg-secondary)',
                            }}
                            placeholder="Please provide a reason so the employee can fix the timesheet..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <button
                            className="primary-button"
                            type="button"
                            onClick={() => setIsRejectModalOpen(false)}
                            style={{ padding: '8px 16px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            className="reject-button"
                            type="submit"
                            style={{ padding: '8px 16px', backgroundColor: 'var(--reject)', color: 'reject-text', border: '1px solid var(--reject-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                        >
                            Reject Timesheet
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};