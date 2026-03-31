import { useState, type ReactNode } from "react";
import { CompaniesContext } from "./CompaniesContext";
import { CompaniesRepository } from "../services/CompaniesRepository";
import type { Company, Companies } from "../types/companies.type";

export const CompaniesProvider = ({ children }: { children: ReactNode }) => {
    const [companies, setCompanies] = useState<Companies>({ data: [] } as unknown as Companies);

    const getCompanies = async () => {
        const data = await CompaniesRepository.getCompanies();
        setCompanies(data);
    };

    const editCompany = async (company: Company) => {
        await CompaniesRepository.editCompany(company);
        setCompanies(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
                ...prev,
                data: prev.data.map(c => c.id === company.id ? company : c)
            };
        });
    };

    const deleteCompany = async (companyId: number) => {
        await CompaniesRepository.deleteCompany(companyId);
        setCompanies(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
                ...prev,
                data: prev.data.filter(c => c.id !== companyId)
            };
        });
    };

    const addCompany = async (company: Omit<Company, "id">) => {
        const newCompany = await CompaniesRepository.addCompany(company);

        setCompanies(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
                ...prev,
                data: [...prev.data, newCompany]
            };
        });

        return newCompany;
    };

    return (
        <CompaniesContext.Provider value={{
            companies,
            getCompanies,
            editCompany,
            deleteCompany,
            addCompany
        }}>
            {children}
        </CompaniesContext.Provider>
    );
};