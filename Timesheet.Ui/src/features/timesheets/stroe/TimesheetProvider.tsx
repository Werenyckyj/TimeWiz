import { useCallback, useState, type ReactNode } from "react";
import type { EditTsWeek, TsWeek } from "../types/tsWeek.type";
import { ApprovalRepository } from "../services/ApprovalRepository";
import { TimesheetContext } from "./TimesheetContext";
import { TimesheetRepository } from "../services/TimesheetRepository";

export const TimesheetProvider = ({ children }: { children: ReactNode }) => {
    const [pending, setPending] = useState<TsWeek[]>([]);
    const [timesheets, setTimesheets] = useState<TsWeek[]>([]);

    const getTimesheets = useCallback(async (userId: number, year: number, week: number) => {
        const data = await TimesheetRepository.getTimesheets(userId, year, week);
        setTimesheets(data);
    }, []);

    const getPendingTimesheets = useCallback(async (projectId: number) => {
        try {
            const data = await ApprovalRepository.getPendingTimesheets(projectId);

            setPending(prev => {
                const otherProjects = prev.filter(ts => ts.project?.id !== projectId);

                return [...otherProjects, ...data];
            });
        } catch (error) {
            console.error(`Failed to fetch pending timesheets for project ${projectId}`, error);
        }
    }, []);

    const editTimesheet = async (timesheetId: number, tsWeek: EditTsWeek) => {
        const updated = await TimesheetRepository.editTimesheet(timesheetId, tsWeek);
        setTimesheets(prev => {
            if (!Array.isArray(prev)) return prev;
            return prev.map(t => t.id === updated.id ? updated : t)
        });
    };

    const addTimesheet = async (tsWeek: EditTsWeek) => {
        const newTimesheet = await TimesheetRepository.addTimesheet(tsWeek);

        setTimesheets(prev => {
            if (!Array.isArray(prev)) return [newTimesheet];
            return [...prev, newTimesheet]
        });
    };

    return (
        <TimesheetContext.Provider value={{
            pending,
            timesheets,
            getPendingTimesheets,
            getTimesheets,
            editTimesheet,
            addTimesheet
        }}>
            {children}
        </TimesheetContext.Provider>
    )
}
