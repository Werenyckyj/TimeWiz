import { useEffect, useState } from "react";
import { useProjects } from "../hooks/useProjects";
import { EditableTable, type ColumnDef } from "../../../shared/components/EditableTable";
import { type Project } from "../types/projects.type";
import { UsersRepository } from "../../users/services/UsersRepository";
import { ProjectMembersRepository } from "../services/ProjectMembersRepository";
import type { User } from "../../users/types/users.type";
import { Modal } from "../../../shared/components/Modal";
import { useAuth } from "../../auth/hooks/useAuth";

export default function Projects() {
    const { projects, getProjects, editProject, deleteProject, addProject } = useProjects();
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState<string>("");
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [projectMembers, setProjectMembers] = useState<User[]>([]);
    const [projectManagers, setProjectManagers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuth();

    useEffect(() => {
        getProjects().catch(error => console.error("Failed to load projects", error));
    }, [getProjects]);

    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("cs-CZ");
    };

    const columns: ColumnDef<Project>[] = [
        { header: "Code", accessor: "code", isRequired: true, type: "text", maxLength: 100 },
        { header: "Name", accessor: "name", isRequired: true, type: "text", maxLength: 100 },
        { header: "Is Active", accessor: "isActive", type: "checkbox", renderCell: (row) => row.isActive ? "✔️" : "❌" },
        { header: "Valid From", accessor: "validFrom", type: "date", renderCell: (row) => formatDate(row.validFrom) },
        { header: "Valid To", accessor: "validTo", type: "date", renderCell: (row) => formatDate(row.validTo) },
    ];

    const handleAdd = async (draft: Partial<Project>) => {
        try {
            if (draft.validFrom && draft.validTo && draft.validFrom > draft.validTo) { setMessage("Error: 'Valid From' date cannot be later than 'Valid To' date."); return; }
            else if (!draft.code || !draft.name) { setMessage("Error: 'Code' and 'Name' are required fields."); return; }
            else {
                if (draft.isActive === null || draft.isActive === undefined) { draft.isActive = false; }
                const newProject = await addProject(draft as Omit<Project, "id">);
                await ProjectMembersRepository.addUserToProject(newProject.id as number, Number(user?.nameid));
                await ProjectMembersRepository.setAsProjectManager(newProject.id as number, Number(user?.nameid));
            }
            setMessage("Project successfully added.");
        } catch (error) {
            setMessage("Error adding project." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const handleEdit = async (draft: Project) => {
        try {
            if (draft.validFrom > draft.validTo) { setMessage("Error: 'Valid From' date cannot be later than 'Valid To' date."); return; }
            else if (!draft.code || !draft.name) { setMessage("Error: 'Code' and 'Name' are required fields."); return; }
            else {
                if (draft.isActive === null || draft.isActive === undefined) { draft.isActive = false; }
                await editProject(draft);
                setMessage("Project successfully updated.");
            }
        } catch (error) {
            setMessage("Error updating project." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const rawProjects = Array.isArray(projects?.data) ? projects.data : [];
    const displayedProjects = showActiveOnly
        ? rawProjects.filter(project => project.isActive)
        : rawProjects;

    const handleDelete = async (id: string | number) => {
        try {
            await deleteProject(id as number);
            setMessage("Project successfully deleted.");
        } catch (error) {
            setMessage("Error deleting project." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const handleEditMembers = async (project: Project) => {
        setSelectedProject(project);
        setSearchQuery("");
        setIsMembersModalOpen(true);

        try {
            if (allUsers.length === 0) {
                const usersResponse = await UsersRepository.getUsers();
                setAllUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
            }
            const members = await ProjectMembersRepository.getProjectUsers(project.id);
            setProjectMembers(members);
            const managers = await ProjectMembersRepository.getProjectManagers(project.id);
            setProjectManagers(managers);
        } catch (error) {
            console.error("Nepodařilo se načíst uživatele pro projekt", error);
        }
    };

    const toggleMember = async (user: User, isCurrentlyMember: boolean) => {
        if (!selectedProject) return;

        try {
            if (isCurrentlyMember) {
                await ProjectMembersRepository.setAsProjectEmployee(selectedProject.id, user.id);
                await ProjectMembersRepository.removeUserFromProject(selectedProject.id, user.id);
                setProjectManagers(prev => prev.filter(u => u.id !== user.id));
                setProjectMembers(prev => prev.filter(u => u.id !== user.id));
            } else {
                await ProjectMembersRepository.addUserToProject(selectedProject.id, user.id);
                setProjectMembers(prev => [...prev, user]);
            }
        } catch (error) {
            alert("Error updating project members.");
            console.error(error);
        }
    };

    const toggleManager = async (user: User, isCurrentlyManager: boolean) => {
        if (!selectedProject) return;

        try {
            if (isCurrentlyManager) {
                await ProjectMembersRepository.setAsProjectEmployee(selectedProject.id, user.id);
                setProjectManagers(prev => prev.filter(u => u.id !== user.id));
            } else {
                await ProjectMembersRepository.setAsProjectManager(selectedProject.id, user.id);
                setProjectManagers(prev => [...prev, user]);
            }
        } catch (error) {
            alert("Error updating project managers.");
            console.error(error);
        }
    };

    const filteredUsers = allUsers.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(query) ||
            user.surname.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
    });

    return (
        <div className="main-content"
            style={{ fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Projects</h2>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {!isAdding && (
                        <button
                            className="primary-button-2"
                            onClick={() => setIsAdding(true)}
                            style={{ padding: '8px 16px', backgroundColor: 'var(--primary-button)', border: '1px solid var(--primary-button-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: 'white' }}
                        >
                            + Add Project
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
                </div>
            )}

            <EditableTable<Project>
                columns={columns}
                isAdding={isAdding}
                setIsAdding={setIsAdding}
                data={displayedProjects}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                extraRowActions={(row) => [
                    { label: "Edit members", onClick: () => handleEditMembers(row) }
                ]}
            />

            <Modal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                title={`Members: ${selectedProject?.name}`}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}
                    />

                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredUsers.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</div>
                        ) : (
                            filteredUsers.map(user => {
                                const isMember = projectMembers.some(pm => pm.id === user.id);
                                const isManager = projectManagers.some(pm => pm.id === user.id);

                                return (
                                    <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: isMember ? 'var(--bg-secondary)' : 'transparent' }}>

                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.name} {user.surname}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</span>
                                        </div>
                                        <div className="manage-project-users-button-group">
                                            {isMember && (
                                                <button
                                                    className={isManager ? "primary-button-2" : "secondary-button"}
                                                    onClick={() => toggleManager(user, isManager)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: 500,
                                                        fontSize: '0.85rem',
                                                        border: isManager ? '1px solid var(--primary-button-border)' : '1px solid var(--border-color)',
                                                        backgroundColor: isManager ? 'var(--primary-button)' : 'var(--bg-secondary)',
                                                        color: isManager ? 'white' : 'var(--text-secondary)',
                                                        margin: '4px'
                                                    }}
                                                >
                                                    {isManager ? "Make Employee" : "Make Manager"}
                                                </button>
                                            )}
                                            <button
                                                className={isMember ? "reject-button" : "primary-button-2"}
                                                onClick={() => toggleMember(user, isMember)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 500,
                                                    fontSize: '0.85rem',
                                                    border: isMember ? '1px solid var(--reject-border)' : '1px solid var(--primary-button-border)',
                                                    backgroundColor: isMember ? 'var(--reject)' : 'var(--primary-button)',
                                                    color: isMember ? 'var(--reject-text)' : 'white',
                                                    margin: '4px'
                                                }}
                                            >
                                                {isMember ? "Remove" : "Add"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span>Total assigned: <strong>{projectMembers.length}</strong>, Managers: <strong>{projectManagers.length}</strong></span>
                        <button className="secondary-button" onClick={() => setIsMembersModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Done
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};