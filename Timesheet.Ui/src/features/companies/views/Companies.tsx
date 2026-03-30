import { useEffect, useState } from "react";
import { useCompanies } from "../hooks/useCompanies";
import type { Company } from "../types/companies.type";

export default function Companies() {
    const { companies, getCompanies, editCompany, deleteCompany } = useCompanies();
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        getCompanies().catch(error => {
            console.error("Failed to load companies on mount", error);
        });
    }, []);

    const handleEditCompany = async (company: Company) => {
        try {
            await editCompany(company);
            setMessage("Company edited successfully.");
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: string } }).response?.data || 'Login failed';

            setMessage("Failed to edit company. " + errorMessage);
        }
    };

    const handleDeleteCompany = async (companyId: string) => {
        try {
            await deleteCompany(companyId);
            setMessage("Company deleted successfully.");
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: string } }).response?.data || 'Login failed';

            setMessage("Failed to delete company. " + errorMessage);
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Companies</h2>
                <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                }}>
                    + Add company
                </button>
            </div>

            {message && (
                <div style={{ padding: '10px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '6px', marginBottom: '1rem' }}>
                    {message}
                </div>
            )}

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>Name</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>Workers</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>CIN</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155', textAlign: 'right' }}>Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(companies?.data) && companies.data.length > 0 ? (
                            companies.data.map((company) => (
                                <tr key={company.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '12px 16px' }}>{company.name}</td>
                                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                        —
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>{company.cin}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleEditCompany(company)}
                                            style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCompany(company.id)}
                                            style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '4px', backgroundColor: '#fef2f2' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                                    Žádné společnosti k zobrazení.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}