import { useEffect, useState } from "react";
import { useUsers } from "../hooks/useUsers";
import type { User } from "../types/users.type";
import { EditableTable, type ColumnDef } from "../../../shared/components/EditableTable";


export default function Users() {
    const { users, getUsers, editUser, deleteUser, addUser } = useUsers();
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState<string>("");


    useEffect(() => {
        getUsers().catch(error => console.error("Failed to load users", error));
    }, [getUsers]);

    const columns: ColumnDef<User>[] = [
        { header: "Name", accessor: "name", type: "text", maxLength: 100 },
        { header: "Surname", accessor: "surname", type: "text", maxLength: 100 },
        { header: "Email", accessor: "email", type: "text", maxLength: 100 },
        { header: "Is Active", accessor: "isActive", type: "readonly", renderCell: (row) => row.isActive ? "✔️" : "❌" },
        { header: "Role", accessor: "role", type: "readonly", renderCell: (row) => row.role ? row.role.name : "No role" },
    ];

    const handleAdd = async (draft: Partial<User>) => {
        try {
            await addUser(draft as Omit<User, "id">);
            setMessage("User successfully added.");
        } catch (error) {
            setMessage("Error adding user." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const handleEdit = async (draft: User) => {
        try {
            await editUser(draft);
            setMessage("User successfully edited.");
        } catch (error) {
            setMessage("Error editing user." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await deleteUser(id as number);
            setMessage("User deleted.");
        } catch (error) {
            setMessage("Error deleting user." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Users</h2>

                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                        + Add User
                    </button>
                )}
            </div>

            {message && (
                <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
                    {message}
                </div>
            )}

            <EditableTable<User>
                columns={columns}
                isAdding={isAdding}
                setIsAdding={setIsAdding}
                data={Array.isArray(users?.data) ? users.data : (Array.isArray(users) ? users : [])}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}