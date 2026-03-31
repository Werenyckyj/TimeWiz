import { createContext } from "react";
import { type Companies, type Company } from "../types/companies.type";

interface CompaniesContextType {
    getCompanies: () => Promise<void>;
    companies: Companies;
    editCompany: (company: Company) => Promise<void>;
    deleteCompany: (companyId: number) => Promise<void>;
    addCompany: (company: Omit<Company, "id">) => Promise<Company>;
}

export const CompaniesContext = createContext<CompaniesContextType | null>(null);