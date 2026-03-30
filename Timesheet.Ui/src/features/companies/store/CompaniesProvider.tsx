import { useState, type ReactNode } from "react";
import { CompaniesContext } from "./CompaniesContext";
import { CompaniesRepository } from "../services/CompaniesRepository"; // Uprav si cestu, pokud máš repozitář jinde
import type { Company } from "../types/companies.type";

export const CompaniesProvider = ({ children }: { children: ReactNode }) => {
    const [companies, setCompanies] = useState<Company[]>([]);

    const getCompanies = async () => {
        const data = await CompaniesRepository.getCompanies();
        setCompanies(data);
    };

    const editCompany = async (company: Company) => {
        await CompaniesRepository.editCompany(company);
        setCompanies(prev => prev.map(c => c.id === company.id ? company : c));
    };

    const deleteCompany = async (companyId: string) => {
        await CompaniesRepository.deleteCompany(companyId);
        setCompanies(prev => prev.filter(c => c.id !== companyId));
    };

    return (
        <CompaniesContext.Provider value={{ companies, getCompanies, editCompany, deleteCompany }}>
            {children}
        </CompaniesContext.Provider>
    );
};