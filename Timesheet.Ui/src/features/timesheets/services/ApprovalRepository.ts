import api from "../../../shared/api/axiosInstance";
import type { TsWeek } from "../types/tsWeek.type";

export const ApprovalRepository = {
    getPendingTimesheets: async (projectId: number): Promise<TsWeek[]> => {
        const response = await api.get(`/project/${projectId}/pending-timesheets`);
        return response.data;
    }
}