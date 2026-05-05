import api from "../../../shared/api/axiosInstance";

export const ReportRepository = {
    get: async (query: string) => {
        return await api.get(`/timesheet/report?${query}`);
    }
};