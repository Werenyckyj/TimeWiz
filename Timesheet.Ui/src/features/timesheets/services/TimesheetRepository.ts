import api from "../../../shared/api/axiosInstance";
import type { EditTsWeek, TsWeek } from "../types/tsWeek.type";

export const TimesheetRepository = {
    getTimesheets: async (userId: number, year: number, week: number): Promise<TsWeek[]> => {
        const response = await api.get(`/user/${userId}/timesheets?year=${year}&week=${week}`);
        return response.data;
    },

    editTimesheet: async (timesheetId: number, tsWeek: EditTsWeek): Promise<TsWeek> => {
        const response = await api.put(`/timesheet/${timesheetId}`, tsWeek);
        return response.data;
    },

    addTimesheet: async (tsWeek: EditTsWeek): Promise<TsWeek> => {
        const response = await api.post(`/timesheet`, tsWeek);
        return response.data;
    }
}