import api from "../../../shared/api/axiosInstance";
import type { Companies, Company } from "../types/companies.type";

export const CompaniesRepository = {
    getCompanies: async (): Promise<Companies> => {
        const response = await api.get<Companies>("/company");
        return response.data;
    },
    editCompany: async (company: Company): Promise<void> => {
        await api.put(`/company/${company.id}`, company);
    },
    deleteCompany: async (companyId: string): Promise<void> => {
        await api.delete(`/company/${companyId}`);
    }
};