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
import { ConfirmationModal } from "../../../shared/components/ConfirmationModal";
import EmailValidator from "../../../shared/components/EmailValidator";

export default function Users() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { users, getUsers, editUser, deleteUser, addUser } = useUsers();
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [addUserMessage, setAddUserMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [addCompanyMessage, setAddCompanyMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [roleOptions, setRoleOptions] = useState<SelectOptions[]>([]);
    const [organizationOptions, setOrganizationOptions] = useState<SelectOptions[]>([]);

    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [pendingUserEdit, setPendingUserEdit] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

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
        { header: "Name", accessor: "name", type: "text", maxLength: 80 },
        { header: "Surname", accessor: "surname", type: "text", maxLength: 100 },
        { header: "Username", accessor: "username", type: "text", maxLength: 120 },
        { header: "Email", accessor: "email", type: "text", maxLength: 180 },
        { header: "Is Active", accessor: "isActive", type: "checkbox", renderCell: (row) => row.isActive ? "✔️" : "❌", width: "10%" },
        { header: "Role", accessor: "roleId", type: "select", options: roleOptions, renderCell: (row) => row.role ? row.role.name : "No role" },
        { header: "Company", accessor: "companyId", type: "select", options: organizationOptions, renderCell: (row) => row.company ? row.company.name : "No company" },
    ];

    const executeEdit = async (draft: User) => {
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
            setMessage({ text: "User successfully edited.", type: "success" });
        } catch (error) {
            setMessage({ text: "Error " + (error instanceof Error ? ` Detail: ${error.message}` : ""), type: "error" });
        }
        setPendingUserEdit(null);
    };

    const handleEdit = async (draft: User) => {
        const originalUser = rawUsers.find(u => u.id === draft.id);
        const originalRoleId = originalUser?.role ? originalUser.role.id : originalUser?.roleId;

        if (originalRoleId && String(originalRoleId) !== String(draft.roleId)) {

            if (String(draft.id) === String(user?.nameid)) {
                setPendingUserEdit(draft);
                setIsRoleModalOpen(true);
                return;
            }
        }

        await executeEdit(draft);
    };

    const rawUsers = Array.isArray(users?.data) ? users.data : [];
    const displayedUsers = showActiveOnly
        ? rawUsers.filter(user => user.isActive)
        : rawUsers;

    const filteredUsers = displayedUsers.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(query) ||
            user.surname.toLowerCase().includes(query) ||
            (user.name.toLowerCase() + ' ' + user.surname.toLowerCase()).includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.company?.name.toLowerCase().includes(query)
        );
    });

    const handleDelete = async (id: string | number) => {
        try {
            await deleteUser(id as number);
            setMessage({ text: "User deleted.", type: "success" });
        } catch (error) {
            setMessage({ text: "Error " + (error instanceof Error ? ` Detail: ${error.message}` : ""), type: "error" });
        }
    };

    const tableData = filteredUsers.map(user => ({
        ...user,
        roleId: user.role ? user.role.id : user.roleId,
        companyId: user.company ? user.company.id : user.companyId
    }));

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.password.length < 8) {
            setAddUserMessage({ text: "Password must be at least 8 characters long.", type: "error" });
            return;
        }

        try {
            const payload = {
                ...formData,
                password: passwordForm.password,
                roleId: formData.roleId ? Number(formData.roleId) : 0,
                companyId: formData.companyId ? Number(formData.companyId) : 0
            };

            await addUser(payload);

            await getUsers();
            setMessage({ text: "User successfully added.", type: "success" });
            setIsModalOpen(false);
            setFormData({ name: "", surname: "", username: "", email: "", roleId: "", companyId: "" });
            setPasswordForm({ password: "" });
        } catch (error) {
            setAddUserMessage({ text: "Error " + (error instanceof Error ? ` Detail: ${error.message}` : ""), type: "error" });
        }
    };

    const handleCompanyFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await CompaniesRepository.addCompany({ name: companyFormData.name, cin: companyFormData.cin });

            await fatchCompanies();
            setAddCompanyMessage({ text: "Company successfully added.", type: "success" });
        } catch (error) {
            setAddCompanyMessage({ text: "Error " + (error instanceof Error ? ` Detail: ${error.message}` : ""), type: "error" });
        }
        setIsCompanyModalOpen(false);
        setCompanyFormData({ name: "", cin: "" });
    }


    return (
        <div className="main-content"
            style={{ fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', flex: '1 1 250px', minWidth: '0' }}>

                    <h2 style={{ marginBottom: '0.5rem' }}>Users</h2>


                    <input
                        type="text"
                        placeholder="Search users by name, email, or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', width: '400px', maxWidth: '100%', boxSizing: 'border-box' }}
                    />
                </div>

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

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
                <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: message.type === "error" ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                    {message.text}
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
                nameAccessor="name"
                entityName="user"
            />
            < Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User" >
                {addUserMessage && (
                    <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: addUserMessage.type === "error" ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                        {addUserMessage.text}
                    </div>)}

                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 calc(50% - 8px)', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Name *</label>
                            <input required type="text" maxLength={80} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }} />
                        </div>
                        <div style={{ flex: '1 1 calc(50% - 8px)', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Surname *</label>
                            <input required type="text" maxLength={100} value={formData.surname} onChange={e => setFormData({ ...formData, surname: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Username *</label>
                        <input required type="text" maxLength={120} value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <EmailValidator onChange={e => setFormData({ ...formData, email: e.target.value })} value={formData.email} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
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
                {addCompanyMessage && (
                    <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: addCompanyMessage.type === "error" ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                        {addCompanyMessage.text}
                    </div>)}

                <form onSubmit={handleCompanyFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Company Name *</label>
                        <input required type="text" maxLength={100} value={companyFormData.name} onChange={e => setCompanyFormData({ ...companyFormData, name: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>CIN *</label>
                        <input required type="text" maxLength={20} value={companyFormData.cin} onChange={e => setCompanyFormData({ ...companyFormData, cin: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <button className="reject-button" type="button" onClick={() => setIsCompanyModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: 'var(--reject)', border: '1px solid var(--reject-border)', borderRadius: '4px', cursor: 'pointer', color: "--reject-text" }}>Cancel</button>
                        <button className="primary-button-2" type="submit" style={{ padding: '8px 16px', backgroundColor: 'var(--primary-button)', color: 'white', border: '1px solid var(--primary-button-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Create Company</button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isRoleModalOpen}
                onClose={() => {
                    setIsRoleModalOpen(false);
                    setPendingUserEdit(null);
                }}
                title="Confirm Role Change"
                message="Changing your role will immediately log you out of the system. Are you sure you want to proceed?"
                onConfirm={() => {
                    if (pendingUserEdit) {
                        executeEdit(pendingUserEdit);
                    }
                    setIsRoleModalOpen(false);
                }}
            />
        </div >
    );
}