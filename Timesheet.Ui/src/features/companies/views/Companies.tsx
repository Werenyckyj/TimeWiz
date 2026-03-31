import { useEffect, useState } from "react";
import { useCompanies } from "../hooks/useCompanies";
import { EditableTable, type ColumnDef } from "../../../shared/components/EditableTable";
import type { Company } from "../types/companies.type";

export default function Companies() {
    const { companies, getCompanies, deleteCompany, editCompany, addCompany } = useCompanies();

    const [message, setMessage] = useState<string>("");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        getCompanies().catch(error => console.error("Failed to load companies", error));
    }, [getCompanies]);
    const columns: ColumnDef<Company>[] = [
        { header: "Name", accessor: "name", type: "text", maxLength: 100 },
        { header: "Workers", accessor: "users", type: "readonly", renderCell: (row) => row.users && row.users.length > 0 ? row.users.length : "No workers" },
        { header: "CIN", accessor: "cin", type: "text", maxLength: 20 },
    ];

    const handleAdd = async (draft: Partial<Company>) => {
        try {
            await addCompany(draft as Company);
            setMessage("Společnost úspěšně přidána.");
        } catch (error) {
            setMessage("Chyba při přidávání společnosti." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const handleEdit = async (draft: Company) => {
        try {
            await editCompany(draft);
            setMessage("Společnost úspěšně upravena.");
        } catch (error) {
            setMessage("Chyba při úpravě společnosti." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm("Opravdu smazat?")) return;
        try {
            await deleteCompany(id as number);
            setMessage("Společnost smazána.");
        } catch (error) {
            setMessage("Chyba při mazání." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Companies</h2>

                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                        + Add company
                    </button>
                )}
            </div>

            {message && (
                <div style={{ padding: '10px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '6px', marginBottom: '1rem' }}>
                    {message}
                </div>
            )}

            <EditableTable<Company>
                data={Array.isArray(companies?.data) ? companies.data : (Array.isArray(companies) ? companies : [])}
                columns={columns}
                isAdding={isAdding}
                setIsAdding={setIsAdding}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}