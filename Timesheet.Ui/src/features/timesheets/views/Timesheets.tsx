import { useEffect, useState, useMemo, useRef } from "react";
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

    useEffect(() => {
        if (!user?.nameid) return;
        getTimesheets(Number(user.nameid), year, week).catch(err => console.error(err));
        getUserProjects(Number(user.nameid)).catch(err => console.error(err));
    }, [user?.nameid, year, week, getTimesheets, getUserProjects]);

    const syncLock = useRef<Set<string>>(new Set());

    useEffect(() => {
        const syncMissingRows = async () => {
            if (!user?.nameid) return;
            const rawTimesheets = Array.isArray((timesheets as TsWeek[])) ? (timesheets as TsWeek[]) : (Array.isArray(timesheets) ? timesheets : []);
            const rawProjects = Array.isArray((projects as Projects)?.data) ? (projects as Projects).data : (Array.isArray(projects) ? projects : []);

            const existingProjectIds = rawTimesheets.map((ts: TsWeek) => ts.project?.id);

            const missingProjects = rawProjects.filter((p: Project) =>
                !existingProjectIds.includes(p.id) &&
                !syncLock.current.has(`${year}-${week}-${p.id}`)
            );

            if (missingProjects.length > 0) {
                let anyAdded = false;
                for (const p of missingProjects) {
                    syncLock.current.add(`${year}-${week}-${p.id}`);

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
                    }
                }
                if (anyAdded) {
                    await getTimesheets(Number(user.nameid), year, week);
                }
            }
        };

        syncMissingRows();
    }, [timesheets, projects, user?.nameid, year, week, addTimesheet, getTimesheets, days]);

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

        const safeVal = val.replace(',', '.');
        const parts = safeVal.split('.');
        if (parts.length > 2) return;

        let finalValue: number | string = safeVal;

        if (safeVal !== "" && !safeVal.endsWith('.')) {
            const parsedHours = parseFloat(safeVal);
            finalValue = isNaN(parsedHours) ? 0 : parsedHours;
        }

        setDrafts(prev => prev.map(ts => {
            if (ts.id !== tsId) return ts;
            const newEntries = [...(ts.tsEntries || [])];
            const existingIdx = newEntries.findIndex(e => toLocalDateString(new Date(e.workDate)) === dateIso);

            if (existingIdx >= 0) {
                (newEntries[existingIdx] as { hours: number | string }).hours = finalValue;
            } else {
                newEntries.push({ id: 0, tsWeekId: ts.id, workDate: new Date(dateIso) as Date, hours: finalValue as unknown as number, notes: "" });
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

    const colSums = days.map(d => {
        const dateIso = toLocalDateString(d);
        return drafts.reduce((acc, ts) => {
            const entry = ts.tsEntries?.find(e => toLocalDateString(new Date(e.workDate)) === dateIso);
            return acc + (entry?.hours || 0);
        }, 0);
    });
    const grandTotal = colSums.reduce((acc, val) => acc + val, 0);

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
                            <th style={{ padding: '12px', textAlign: 'left', width: '25%' }}>Project</th>
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
                                const rowSum = ts.tsEntries?.reduce((acc, e) => acc + (e.hours || 0), 0) || 0;

                                return (
                                    <tr key={ts.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isRejected ? 'var(--bg-secondary)' : 'transparent' }}>

                                        <td className="mobile-card-header" data-label="Project" style={{ padding: '12px', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {ts.project?.name || "Unknown Project"}
                                            {isRejected && ts.comment && (
                                                <span title={`Note from Manager: ${ts.comment}`} style={{ cursor: 'help', color: '#ef4444' }}>
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </span>
                                            )}
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
                                                        onFocus={(e) => { if (val === 0) e.target.value = ''; }}
                                                        onBlur={(e) => { if (val === 0) e.target.value = '0'; }}
                                                        value={val}
                                                        onChange={(e) => handleHoursChange(ts.id, dateIso, e.target.value)}
                                                        disabled={isLocked}
                                                        maxLength={5}
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

                                        <td data-label="∑ Total" style={{ padding: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{rowSum}</td>

                                        <td data-label="Action" style={{ padding: '12px' }}>
                                            {isLocked ? (
                                                <span style={{ fontSize: '0.85rem', color: ts.status === "Approved" ? '#10b981' : 'var(--primary-button-hover)', fontWeight: 'bold' }}>
                                                    {ts.status}
                                                </span>
                                            ) : (
                                                <button
                                                    className="secondary-button"
                                                    onClick={() => handleSubmitRow(ts)}
                                                    style={{ padding: '6px 12px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-color)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >
                                                    Send
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
                                        {sum > 0 ? sum : 0}
                                    </td>
                                );
                            })}

                            <td data-label="Grand Total" style={{ padding: '12px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}>{grandTotal}</td>
                            <td className="comp-only" data-label=""></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}