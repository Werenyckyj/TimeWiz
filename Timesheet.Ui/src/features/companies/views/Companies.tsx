import { useEffect, useState } from "react";
import { useCompanies } from "../hooks/useCompanies";
import { EditableTable, type ColumnDef } from "../../../shared/components/EditableTable";
import type { Company } from "../types/companies.type";

export default function Companies() {
    const { companies, getCompanies, editCompany, addCompany } = useCompanies();

    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        getCompanies().catch(error => console.error("Failed to load companies", error));
    }, [getCompanies]);

    const columns: ColumnDef<Company>[] = [
        { header: "Name", accessor: "name", type: "text", maxLength: 100 },
        { header: "Workers", accessor: "employees", type: "readonly", renderCell: (row) => row.employees && row.employees.length > 0 ? row.employees.length : "No workers" },
        { header: "CIN", accessor: "cin", type: "text", maxLength: 20 },
    ];

    const handleAdd = async (draft: Partial<Company>) => {
        try {
            if (!draft.name || !draft.cin) {
                setMessage({ text: "Name and CIN are required.", type: "error" });
                return;
            }

            await addCompany(draft as Company);
            setMessage({ text: "Company successfully added.", type: "success" });
        } catch (error) {
            setMessage({ text: "Error adding company." + (error instanceof Error ? ` Detail: ${error.message}` : ""), type: "error" });
        }
    };

    const handleEdit = async (draft: Company) => {
        try {
            if (!draft.name || !draft.cin) {
                setMessage({ text: "Name and CIN are required.", type: "error" });
                return;
            }

            await editCompany(draft);
            setMessage({ text: "Company successfully updated.", type: "success" });
        } catch (error) {
            setMessage({ text: "Error updating company." + (error instanceof Error ? ` Detail: ${error.message}` : ""), type: "error" });
        }
    };

    return (
        <div className="main-content"
            style={{ fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Companies</h2>

                {!isAdding && (
                    <button
                        className="primary-button-2"
                        onClick={() => setIsAdding(true)}
                        style={{ padding: '8px 16px', backgroundColor: 'var(--primary-button)', border: '1px solid var(--primary-button-border)', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                        + Add company
                    </button>
                )}
            </div>

            {message && (
                <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: message.type === "error" ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                    {message.text}
                </div>
            )}

            <EditableTable<Company>
                data={Array.isArray(companies?.data) ? companies.data : (Array.isArray(companies) ? companies : [])}
                columns={columns}
                isAdding={isAdding}
                setIsAdding={setIsAdding}
                onAdd={handleAdd}
                onEdit={handleEdit}
                entityName="company"
                nameAccessor="name"
            />
        </div>
    );
}