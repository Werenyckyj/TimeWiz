import { createContext } from "react";
import type { EditTsWeek, TsWeek } from "../types/tsWeek.type";

interface TimesheetContextType {
    getPendingTimesheets: (projectId: number) => Promise<void>;
    getTimesheets: (userId: number, year: number, week: number) => Promise<void>;
    timesheets: TsWeek[];
    pending: TsWeek[];
    editTimesheet: (timesheetId: number, tsWeek: EditTsWeek) => Promise<void>;
    addTimesheet: (tsWeek: EditTsWeek) => Promise<void>;
}

export const TimesheetContext = createContext<TimesheetContextType | null>(null);