import { CompaniesContext } from "../store/CompaniesContext";
import { useContext } from "react";

export const useCompanies = () => {
    const context = useContext(CompaniesContext);
    if (!context) {
        throw new Error("useCompanies must be used within a CompaniesProvider");
    }
    return context;
};