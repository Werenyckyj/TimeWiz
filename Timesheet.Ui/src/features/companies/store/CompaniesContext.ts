import { createContext } from "react";
import { type Companies, type Company } from "../types/companies.type";

interface CompaniesContextType {
    getCompanies: () => Promise<void>;
    companies: Companies;
    editCompany: (company: Company) => Promise<void>;
    deleteCompany: (companyId: string) => Promise<void>;
}

export const CompaniesContext = createContext<CompaniesContextType | null>(null);