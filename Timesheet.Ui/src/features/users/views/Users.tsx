import { useEffect, useState } from "react";
import { useUsers } from "../hooks/useUsers";
import type { User } from "../types/users.type";
import { EditableTable, type ColumnDef } from "../../../shared/components/EditableTable";
import type { SelectOptions } from "../../../shared/components/EditableTable";
import { RoleRepository } from "../../roles/services/RoleRepository";
import { Modal } from "../../../shared/components/Modal";
import { CompaniesRepository } from "../../companies/services/CompaniesRepository"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { PasswordField } from "../../../shared/components/PassworField";



export default function Users() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { users, getUsers, editUser, deleteUser, addUser } = useUsers();
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState<string>("");
    const [roleOptions, setRoleOptions] = useState<SelectOptions[]>([]);
    const [organizationOptions, setOrganizationOptions] = useState<SelectOptions[]>([]);

    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "", surname: "", username: "", email: "", roleId: "", companyId: ""
    });
    const [passwordForm, setPasswordForm] = useState({ password: "" });

    const [companyFormData, setCompanyFormData] = useState({ name: "", cin: "" });

    const fatchCompanies = async () => {
        const fetchedCompanies = await CompaniesRepository.getCompanies();
        const oOptions = fetchedCompanies.data.map(company => ({
            value: company.id,
            label: company.name
        }));
        setOrganizationOptions(oOptions);
    };

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

                await fatchCompanies();

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
        { header: "Company", accessor: "companyId", type: "select", options: organizationOptions, renderCell: (row) => row.company ? row.company.name : "No company" },
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
                password: passwordForm.password,
                roleId: formData.roleId ? Number(formData.roleId) : 0,
                companyId: formData.companyId ? Number(formData.companyId) : 0
            };

            await addUser(payload);

            await getUsers();
            setMessage("User successfully added.");
            setIsModalOpen(false);
            setFormData({ name: "", surname: "", username: "", email: "", roleId: "", companyId: "" });
            setPasswordForm({ password: "" });
        } catch (error) {
            setMessage("Error adding user." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const handleCompanyFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await CompaniesRepository.addCompany({ name: companyFormData.name, cin: companyFormData.cin });

            await fatchCompanies();
            setMessage("Company successfully added.");
        } catch (error) {
            setMessage("Error adding company." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
        setIsCompanyModalOpen(false);
        setCompanyFormData({ name: "", cin: "" });
    }

    return (
        <div className="main-content"
            style={{ fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Users</h2>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {(!isAdding && user?.role === 'Admin') && (
                        <button
                            className="primary-button-2"
                            onClick={() => setIsModalOpen(true)}
                            style={{ padding: '8px 16px', backgroundColor: 'var(--primary-button)', border: '1px solid var(--primary-button-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: 'white' }}
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

            {message && (
                <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: message.includes("Error") ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                    {message}
                </div>)}

            <EditableTable<User>
                columns={columns}
                isAdding={false}
                setIsAdding={setIsAdding}
                data={tableData}
                onAdd={async () => { }}
                onEdit={user?.role === "Admin" ? handleEdit : undefined}
                onDelete={user?.role === "Admin" ? handleDelete : undefined}
                extraRowActions={(row) => [
                    {
                        label: "View Details", onClick: () => navigate(`/users/${row.id}`)
                    }
                ]}
            />
            < Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User" >
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 calc(50% - 8px)', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Name *</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }} />
                        </div>
                        <div style={{ flex: '1 1 calc(50% - 8px)', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Surname *</label>
                            <input required type="text" value={formData.surname} onChange={e => setFormData({ ...formData, surname: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Username *</label>
                        <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email *</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password *</label>

                        <PasswordField formData={passwordForm} setFormData={setPasswordForm} />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 calc(50% - 8px)', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role</label>
                            <select value={formData.roleId} onChange={e => setFormData({ ...formData, roleId: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}>
                                <option value="">-- Select --</option>
                                {roleOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {roleOptions.find(opt => String(opt.value) === String(formData.roleId))?.label === "Externist" && (
                            <div style={{ flex: '1 1 calc(50% - 8px)', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Company</label>
                                <select value={formData.companyId} onChange={e => setFormData({ ...formData, companyId: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}>
                                    <option value="">-- Select --</option>
                                    {organizationOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {roleOptions.find(opt => String(opt.value) === String(formData.roleId))?.label === "Externist" && (
                        <button
                            type="button"
                            onClick={() => setIsCompanyModalOpen(true)}
                            style={{ padding: '4px 0px', border: 'none', backgroundColor: 'transparent', color: 'var(--primary-button)', cursor: 'pointer', fontWeight: 700, alignSelf: 'flex-end' }}
                        >
                            Add new company
                        </button>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <button className="reject-button" type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: 'var(--reject)', border: '1px solid var(--reject-border)', borderRadius: '4px', cursor: 'pointer', color: "--reject-text" }}>Cancel</button>
                        <button className="primary-button-2" type="submit" style={{ padding: '8px 16px', backgroundColor: 'var(--primary-button)', color: 'white', border: '1px solid var(--primary-button-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Create User</button>
                    </div>
                </form>
            </Modal >

            <Modal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title="Add New Company">
                <form onSubmit={handleCompanyFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Company Name *</label>
                        <input required type="text" value={companyFormData.name} onChange={e => setCompanyFormData({ ...companyFormData, name: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>CIN *</label>
                        <input required type="text" value={companyFormData.cin} onChange={e => setCompanyFormData({ ...companyFormData, cin: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <button className="reject-button" type="button" onClick={() => setIsCompanyModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: 'var(--reject)', border: '1px solid var(--reject-border)', borderRadius: '4px', cursor: 'pointer', color: "--reject-text" }}>Cancel</button>
                        <button className="primary-button-2" type="submit" style={{ padding: '8px 16px', backgroundColor: 'var(--primary-button)', color: 'white', border: '1px solid var(--primary-button-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Create Company</button>
                    </div>
                </form>
            </Modal>
        </div >
    );
}