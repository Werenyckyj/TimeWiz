import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useTimesheet } from "../hooks/useTimesheet";
import { useProjects } from "../../projects/hooks/useProjects";
import type { TsWeek } from "../types/tsWeek.type";
import type { Project, Projects } from "../../projects/types/projects.type";

const toLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getISOWeekInfo = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week };
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

const globalSyncLock = new Set<string>();

export default function Timesheet() {
    const { user } = useAuth();
    const { timesheets, getTimesheets, editTimesheet, addTimesheet } = useTimesheet();
    const { projects, getUserProjects } = useProjects();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [drafts, setDrafts] = useState<TsWeek[]>([]);
    const [message, setMessage] = useState<string | null>(null);

    const [prevTimesheets, setPrevTimesheets] = useState<TsWeek[] | null>(null);
    const [prevWeek, setPrevWeek] = useState<number | null>(null);

    const { year, week } = getISOWeekInfo(currentDate);
    const days = useMemo(() => getDaysOfWeek(year, week), [year, week]);
    const [openCommentId, setOpenCommentId] = useState<number | null>(null);
    const [dataLoadedFor, setDataLoadedFor] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.nameid) return;

        let ignore = false;

        const loadData = async () => {
            setDataLoadedFor(null);
            try {
                await Promise.all([
                    getTimesheets(Number(user.nameid), year, week),
                    getUserProjects(Number(user.nameid))
                ]);

                if (!ignore) {
                    setDataLoadedFor(`${year}-${week}`);
                }

                setDataLoadedFor(`${year}-${week}`);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        loadData();
        return () => { ignore = true; };
    }, [user?.nameid, year, week, getTimesheets, getUserProjects]);

    useEffect(() => {
        const syncMissingRows = async () => {
            if (!user?.nameid || dataLoadedFor !== `${year}-${week}`) return;

            const rawTimesheets = Array.isArray((timesheets as TsWeek[])) ? (timesheets as TsWeek[]) : (Array.isArray(timesheets) ? timesheets : []);
            const rawProjects = Array.isArray((projects as Projects)?.data) ? (projects as Projects).data : (Array.isArray(projects) ? projects : []);

            const currentWeekTimesheets = rawTimesheets.filter(ts => ts.year === year && ts.weekNumber === week);
            const existingProjectIds = currentWeekTimesheets.map(ts => ts.project?.id);

            const missingProjects = rawProjects.filter((p: Project) =>
                !existingProjectIds.includes(p.id) &&
                !globalSyncLock.has(`${year}-${week}-${p.id}`)
            );

            if (missingProjects.length > 0) {
                let anyAdded = false;
                for (const p of missingProjects) {
                    globalSyncLock.add(`${year}-${week}-${p.id}`);

                    try {
                        await addTimesheet({
                            projectId: p.id,
                            userId: Number(user.nameid),
                            year: year,
                            weekNumber: week,
                            comment: "",
                            status: "Draft",
                            tsEntries: [],
                            daysInWeek: 7,
                            startDate: toLocalDateString(days[0]) as string,
                        });
                        anyAdded = true;
                    } catch (error) {
                        console.error(`Failed to automatically create timesheet for project ${p.name}`, error);
                        globalSyncLock.delete(`${year}-${week}-${p.id}`);
                    }
                }
                if (anyAdded) {
                    await getTimesheets(Number(user.nameid), year, week);
                }
            }
        };

        syncMissingRows();
    }, [timesheets, projects, user?.nameid, year, week, addTimesheet, getTimesheets, days, dataLoadedFor]);

    if (timesheets !== prevTimesheets || week !== prevWeek) {
        setPrevTimesheets(timesheets);
        setPrevWeek(week);

        const rawTimesheets = Array.isArray((timesheets as TsWeek[]))
            ? (timesheets as TsWeek[])
            : (Array.isArray(timesheets) ? timesheets : []);

        const currentWeekTimesheets = rawTimesheets.filter((ts: TsWeek) => ts.year === year && ts.weekNumber === week);
        currentWeekTimesheets.sort((a: TsWeek, b: TsWeek) => (a.project?.name || "").localeCompare(b.project?.name || ""));

        setDrafts(currentWeekTimesheets);
    }

    const goToLastWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    const goToNextWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    const goToToday = () => setCurrentDate(new Date());

    const handleHoursChange = (tsId: number, dateIso: string, val: string) => {
        if (!/^[0-9.,]*$/.test(val)) return;

        let safeVal = val.replace(',', '.');
        const parts = safeVal.split('.');
        if (parts.length > 2) return;

        if (/^0[0-9]/.test(safeVal)) {
            safeVal = safeVal.replace(/^0/, '');
        }

        if (safeVal !== "" && safeVal !== ".") {
            const parsedHours = parseFloat(safeVal);
            if (parsedHours > 24) safeVal = "24";
            if (parsedHours < 0) safeVal = "0";
        }

        setDrafts(prev => prev.map(ts => {
            if (ts.id !== tsId) return ts;
            const newEntries = [...(ts.tsEntries || [])];
            const existingIdx = newEntries.findIndex(e => toLocalDateString(new Date(e.workDate)) === dateIso);

            if (existingIdx >= 0) {
                (newEntries[existingIdx] as { hours: number | string }).hours = safeVal;
            } else {
                newEntries.push({ id: 0, tsWeekId: ts.id, workDate: new Date(dateIso) as Date, hours: safeVal as unknown as number, notes: "" });
            }
            return { ...ts, tsEntries: newEntries };
        }));
    };

    const handleSaveAll = async () => {
        setMessage("Saving...");
        try {
            const unlocked = drafts.filter(ts => ts.status !== "Pending" && ts.status !== "Approved");
            for (const ts of unlocked) {

                const cleanEntries = ts.tsEntries.map(e => ({
                    ...e,
                    hours: Number(e.hours) || 0
                }));

                await editTimesheet(ts.id, {
                    projectId: ts.project.id,
                    userId: ts.userId,
                    year: ts.year,
                    weekNumber: ts.weekNumber,
                    comment: ts.comment,
                    status: ts.status,
                    tsEntries: cleanEntries,
                    daysInWeek: ts.tsEntries.length,
                    startDate: ts.tsEntries.length > 0
                        ? toLocalDateString(new Date(ts.tsEntries[0].workDate))
                        : toLocalDateString(new Date(ts.year, 0, 1))
                });
            }
            setMessage("All draft timesheets saved successfully.");
            await getTimesheets(Number(user?.nameid), year, week);
        } catch (error) {
            setMessage("Error during saving: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const handleSubmitRow = async (ts: TsWeek) => {
        try {
            await editTimesheet(ts.id, {
                projectId: ts.project.id,
                userId: ts.userId,
                year: ts.year,
                weekNumber: ts.weekNumber,
                comment: ts.comment,
                status: "Submitted",
                tsEntries: ts.tsEntries,
                daysInWeek: ts.tsEntries.length,
                startDate: ts.tsEntries.length > 0
                    ? toLocalDateString(new Date(ts.tsEntries[0].workDate))
                    : toLocalDateString(new Date(ts.year, 0, 1))
            });
            setMessage(`Timesheet for ${ts.project.name} was submitted for approval.`);
            await getTimesheets(Number(user?.nameid), year, week);
        } catch (error) {
            setMessage("Error during submission: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const handleRevertToDraft = async (ts: TsWeek) => {
        try {
            setMessage("Reverting to draft...");
            await editTimesheet(ts.id, {
                projectId: ts.project.id,
                userId: ts.userId,
                year: ts.year,
                weekNumber: ts.weekNumber,
                comment: ts.comment,
                status: "Draft", // Vracíme zpět do stavu Draft
                tsEntries: ts.tsEntries,
                daysInWeek: ts.tsEntries.length,
                startDate: ts.tsEntries.length > 0
                    ? toLocalDateString(new Date(ts.tsEntries[0].workDate))
                    : toLocalDateString(new Date(ts.year, 0, 1))
            });
            setMessage(`Timesheet for ${ts.project.name} is back in Draft and can be edited.`);

            await getTimesheets(Number(user?.nameid), year, week);
        } catch (error) {
            setMessage("Error reverting timesheet: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const colSums = days.map(d => {
        const dateIso = toLocalDateString(d);
        const sumRaw = drafts.reduce((acc, ts) => {
            const entry = ts.tsEntries?.find(e => toLocalDateString(new Date(e.workDate)) === dateIso);
            const hours = parseFloat(entry?.hours as unknown as string) || 0;
            return acc + hours;
        }, 0);
        return Number(sumRaw.toFixed(3));
    });

    const grandTotal = Number(colSums.reduce((acc, val) => acc + val, 0).toFixed(3));

    return (
        <div className="main-content">

            <div className="timesheet-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    Week {week} / {year}
                </div>

                <div className="comp-only" style={{ display: 'flex', gap: '8px' }}>
                    <button className="primary-button" onClick={goToLastWeek} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>◀</span>
                            <span className="comp-only"> Last week</span>
                        </div>
                    </button>
                    <input
                        type="date"
                        value={toLocalDateString(currentDate)}
                        onChange={(e) => {
                            if (e.target.value) setCurrentDate(new Date(e.target.value));
                        }}
                        style={{
                            padding: '7px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                            cursor: 'pointer'
                        }}
                    />
                    <button className="primary-button" onClick={goToToday} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontWeight: 'bold', color: 'var(--text-primary)' }}>Today</button>
                    <button className="primary-button" onClick={goToNextWeek} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="comp-only">Next week </span>
                            <span>▶</span>
                        </div>
                    </button>
                </div>

                <button
                    className="primary-button-2 save-button"
                    onClick={handleSaveAll}
                >
                    Save
                </button>

            </div>

            <div className="mobile-only" style={{ gap: '8px', margin: '1rem auto', justifyContent: 'center', width: '100%' }}>
                <button className="primary-button" onClick={goToLastWeek} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>◀</span>
                        <span className="comp-only"> Last week</span>
                    </div>
                </button>
                <input
                    type="date"
                    value={toLocalDateString(currentDate)}
                    onChange={(e) => {
                        if (e.target.value) setCurrentDate(new Date(e.target.value));
                    }}
                    style={{
                        padding: '7px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit'
                    }}
                />
                <button className="primary-button" onClick={goToToday} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontWeight: 'bold', color: 'var(--text-primary)' }}>Today</button>
                <button className="primary-button" onClick={goToNextWeek} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="comp-only">Next week </span>
                        <span>▶</span>
                    </div>
                </button>
            </div>

            {message && (
                <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: message.includes("Error") ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                    {message}
                </div>
            )}

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left', width: '17%' }}>Project</th>
                            {days.map((d, i) => (
                                <th key={i} style={{ padding: '12px', width: '9%' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {d.toLocaleDateString("en-US", { weekday: 'short' })}
                                    </div>
                                    <div>{d.getDate()}. {d.getMonth() + 1}.</div>
                                </th>
                            ))}
                            <th style={{ padding: '12px', width: '8%' }}>∑</th>
                            <th style={{ padding: '12px', width: '12%' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drafts.length === 0 ? (
                            <tr>
                                <td colSpan={10} style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading your projects for this week...</td>
                            </tr>
                        ) : (
                            drafts.map(ts => {
                                const isLocked = ts.status === "Submitted" || ts.status === "Approved";
                                const isRejected = ts.status === "Rejected";
                                const rowSumRaw = ts.tsEntries?.reduce((acc, e) => acc + (parseFloat(e.hours as unknown as string) || 0), 0) || 0;
                                const rowSum = Number(rowSumRaw.toFixed(2));

                                return (
                                    <tr key={ts.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isRejected ? 'var(--bg-secondary)' : 'transparent' }}>

                                        <td className="mobile-card-header" data-label="Project" style={{ padding: '12px', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: isRejected ? 'var(--reject-timesheet-text)' : 'var(--text-primary)' }}>{ts.project?.name || "Unknown Project"}</span>

                                                {isRejected && ts.comment && (
                                                    <button
                                                        onClick={() => setOpenCommentId(openCommentId === ts.id ? null : ts.id)}
                                                        onBlur={() => setOpenCommentId(null)}
                                                        title="Click to view manager's note"
                                                        style={{
                                                            background: 'none', border: 'none', color: 'var(--text-primary)',
                                                            cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
                                                            borderRadius: '50%', backgroundColor: openCommentId === ts.id ? 'var(--reject)' : 'transparent',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                    >
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </button>
                                                )}

                                                {openCommentId === ts.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 'calc(100% + 4px)',
                                                        left: 40,
                                                        zIndex: 50,
                                                        minWidth: '220px',
                                                        maxWidth: '300px',
                                                        padding: '12px',
                                                        backgroundColor: 'var(--reject)',
                                                        border: '1px solid var(--reject-border)',
                                                        borderRadius: '6px',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 400
                                                    }}>
                                                        <strong style={{ display: 'block', marginBottom: '4px' }}>Manager's Note:</strong>
                                                        {ts.comment}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {days.map((d, i) => {
                                            const dateIso = toLocalDateString(d);
                                            const entry = ts.tsEntries?.find(e => toLocalDateString(new Date(e.workDate)) === dateIso);
                                            const val = entry?.hours || 0;

                                            const mobileLabel = `${d.toLocaleDateString("en-US", { weekday: 'short' })} ${d.getDate()}. ${d.getMonth() + 1}.`;

                                            return (
                                                <td key={i} data-label={mobileLabel} style={{ padding: '8px' }}>
                                                    <input
                                                        type="text"
                                                        min="0" max="24" step="any"
                                                        onFocus={(e) => { if (val === 0 || String(val) === '0') e.target.value = ''; }}
                                                        onBlur={() => {
                                                            let currentVal = parseFloat(val as unknown as string);
                                                            if (isNaN(currentVal)) currentVal = 0;
                                                            handleHoursChange(ts.id, dateIso, currentVal.toString());
                                                        }}
                                                        value={val}
                                                        onChange={(e) => handleHoursChange(ts.id, dateIso, e.target.value)}
                                                        disabled={isLocked}
                                                        maxLength={6}
                                                        style={{
                                                            width: '100%', padding: '6px', textAlign: 'center', boxSizing: 'border-box',
                                                            border: '1px solid var(--border-color)', borderRadius: '4px',
                                                            backgroundColor: isLocked ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                                                            color: isLocked ? 'var(--text-secondary)' : 'var(--text-primary)'
                                                        }}
                                                    />
                                                </td>
                                            );
                                        })}

                                        <td data-label="∑ Total" style={{ padding: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{rowSum} h</td>

                                        <td data-label="Action" style={{ padding: '12px' }}>
                                            {isLocked ? (
                                                ts.status === "Approved" ? (
                                                    <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>
                                                        {ts.status}
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="reject-button"
                                                        onClick={() => handleRevertToDraft(ts)}
                                                        style={{ padding: '6px 12px', backgroundColor: 'var(--reject)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    >
                                                        Edit
                                                    </button>
                                                )
                                            ) : (
                                                <button
                                                    className="success-button"
                                                    onClick={() => handleSubmitRow(ts)}
                                                    style={{ padding: '6px 12px', backgroundColor: 'var(--success-2)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >
                                                    Submit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    <tfoot style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '2px solid var(--border-color)', fontWeight: 'bold' }}>
                        <tr>
                            <td data-label="" style={{ padding: '12px', textAlign: 'left' }}>∑ Total</td>

                            {colSums.map((sum, i) => {
                                const d = days[i];
                                const mobileLabel = `${d.toLocaleDateString("en-US", { weekday: 'short' })}`;
                                return (
                                    <td key={i} data-label={mobileLabel} style={{ padding: '12px' }}>
                                        {sum > 0 ? sum : 0} h
                                    </td>
                                );
                            })}

                            <td data-label="Grand Total" style={{ padding: '12px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}>{grandTotal} h</td>
                            <td className="comp-only" data-label=""></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}