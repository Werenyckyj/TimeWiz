import { useEffect, useState } from "react";
import { useUsers } from "../hooks/useUsers";
import type { User } from "../types/users.type";
import { EditableTable, type ColumnDef } from "../../../shared/components/EditableTable";
import type { SelectOptions } from "../../../shared/components/EditableTable";
import { RoleRepository } from "../../roles/services/RoleRepository";
import { Modal } from "../../../shared/components/Modal";
import { CompaniesRepository } from "../../companies/services/CompaniesRepository"; // Přidán import
import { useNavigate } from "react-router-dom";



export default function Users() {
    const navigate = useNavigate();
    const { users, getUsers, editUser, deleteUser, addUser } = useUsers();
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState<string>("");
    const [roleOptions, setRoleOptions] = useState<SelectOptions[]>([]);
    const [organizationOptions, setOrganizationOptions] = useState<SelectOptions[]>([]);

    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: "", surname: "", username: "", email: "", password: "", roleId: "", companyId: ""
    });

    useEffect(() => {
        getUsers().catch(error => console.error("Failed to load users", error));

        const fetchData = async () => {
            try {
                const fetchedRoles = await RoleRepository.getRoles();
                const options = fetchedRoles.data.map(role => ({
                    value: role.id,
                    label: role.name
                }));
                setRoleOptions(options);

                const fetchedCompanies = await CompaniesRepository.getCompanies();
                const oOptions = fetchedCompanies.data.map(company => ({
                    value: company.id,
                    label: company.name
                }));
                setOrganizationOptions(oOptions);

            } catch (error) {
                console.error("Nepodařilo se načíst role nebo organizace", error);
            }
        };

        fetchData();
    }, [getUsers]);

    const columns: ColumnDef<User>[] = [
        { header: "Name", accessor: "name", type: "text", maxLength: 100 },
        { header: "Surname", accessor: "surname", type: "text", maxLength: 100 },
        { header: "Username", accessor: "username", type: "text", maxLength: 100 },
        { header: "Email", accessor: "email", type: "text", maxLength: 100 },
        { header: "Is Active", accessor: "isActive", type: "checkbox", renderCell: (row) => row.isActive ? "✔️" : "❌" },
        { header: "Role", accessor: "roleId", type: "select", options: roleOptions, renderCell: (row) => row.role ? row.role.name : "No role" },
        { header: "Organization", accessor: "companyId", type: "select", options: organizationOptions, renderCell: (row) => row.company ? row.company.name : "No organization" },
    ];

    const handleEdit = async (draft: User) => {
        try {
            await editUser({
                id: draft.id,
                name: draft.name,
                surname: draft.surname,
                username: draft.username,
                email: draft.email,
                isActive: draft.isActive,
                roleId: draft.roleId ? Number(draft.roleId) : 0,
                companyId: draft.companyId ? Number(draft.companyId) : 0
            });

            await getUsers();
            setMessage("User successfully edited.");
        } catch (error) {
            setMessage("Error editing user." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const rawUsers = Array.isArray(users?.data) ? users.data : [];
    const displayedUsers = showActiveOnly
        ? rawUsers.filter(user => user.isActive)
        : rawUsers;

    const handleDelete = async (id: string | number) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await deleteUser(id as number);
            setMessage("User deleted.");
        } catch (error) {
            setMessage("Error deleting user." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const tableData = displayedUsers.map(user => ({
        ...user,
        roleId: user.role ? user.role.id : user.roleId,
        companyId: user.company ? user.company.id : user.companyId
    }));

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                roleId: formData.roleId ? Number(formData.roleId) : 0,
                companyId: formData.companyId ? Number(formData.companyId) : 0
            };

            await addUser(payload);

            await getUsers();
            setMessage("User successfully added.");
            setIsModalOpen(false);
            setFormData({ name: "", surname: "", username: "", email: "", password: "", roleId: "", companyId: "" });
        } catch (error) {
            setMessage("Error adding user." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Users</h2>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {!isAdding && (
                        <button
                            className="primary-button"
                            onClick={() => setIsModalOpen(true)}
                            style={{ padding: '8px 16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                        >
                            + Add User
                        </button>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showActiveOnly}
                            onChange={(e) => setShowActiveOnly(e.target.checked)}
                        />
                        Show active only
                    </label>
                </div>
            </div>

            {
                message && (
                    <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: message.includes("Error") ? '#f8d7da' : '#d4edda', color: message.includes("Error") ? '#721c24' : '#155724', borderRadius: '4px' }}>
                        {message}
                    </div>
                )
            }

            <EditableTable<User>
                columns={columns}
                isAdding={false}
                setIsAdding={setIsAdding}
                data={tableData}
                onAdd={async () => { }}
                onEdit={handleEdit}
                onDelete={handleDelete}
                extraRowActions={(row) => [
                    {
                        label: "View Details", onClick: () => navigate(`/users/${row.id}`)
                    }
                ]}
            />
            < Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User" >
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Name *</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Surname *</label>
                            <input required type="text" value={formData.surname} onChange={e => setFormData({ ...formData, surname: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Username *</label>
                        <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email *</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password *</label>

                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                style={{ padding: '8px', paddingRight: '36px', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}
                            />

                            <button
                                type="button"
                                className="button-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '8px',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', color: 'var(--text-secondary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                                }}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role</label>
                            <select value={formData.roleId} onChange={e => setFormData({ ...formData, roleId: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                <option value="">-- Vyberte --</option>
                                {roleOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Organization</label>
                            <select value={formData.companyId} onChange={e => setFormData({ ...formData, companyId: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                <option value="">-- Vyberte --</option>
                                {organizationOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <button className="primary-button" type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        <button className="secondary-button" type="submit" style={{ padding: '8px 16px', backgroundColor: 'var(--bg-secondary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Create User</button>
                    </div>
                </form>
            </Modal >
        </div >
    );
}