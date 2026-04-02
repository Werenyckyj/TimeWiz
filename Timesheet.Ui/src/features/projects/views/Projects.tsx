import { useEffect, useState } from "react";
import { useProjects } from "../hooks/useProjects";
import { EditableTable, type ColumnDef } from "../../../shared/components/EditableTable";
import { type Project } from "../types/projects.type";
import { UsersRepository } from "../../users/services/UsersRepository";
import { ProjectMembersRepository } from "../services/ProjectMembersRepository";
import type { User } from "../../users/types/users.type";
import { Modal } from "../../../shared/components/Modal";

export default function Projects() {
    const { projects, getProjects, editProject, deleteProject, addProject } = useProjects();
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState<string>("");
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [projectMembers, setProjectMembers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        getProjects().catch(error => console.error("Failed to load projects", error));
    }, [getProjects]);

    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("cs-CZ");
    };

    const columns: ColumnDef<Project>[] = [
        { header: "Code", accessor: "code", type: "text", maxLength: 100 },
        { header: "Name", accessor: "name", type: "text", maxLength: 100 },
        { header: "Is Active", accessor: "isActive", type: "checkbox", renderCell: (row) => row.isActive ? "✔️" : "❌" },
        { header: "Valid From", accessor: "validFrom", type: "date", renderCell: (row) => formatDate(row.validFrom) },
        { header: "Valid To", accessor: "validTo", type: "date", renderCell: (row) => formatDate(row.validTo) },
    ];

    const handleAdd = async (draft: Partial<Project>) => {
        try {
            await addProject(draft as Omit<Project, "id">);
            setMessage("Project successfully added.");
        } catch (error) {
            setMessage("Error adding project." + (error instanceof Error ? ` Detail: ${error.message}` : ""));
        }
    };

    const handleEdit = async (draft: Project) => {
        try {
            await editProject(draft);
            setMessage("Project successfully updated.");
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
        } catch (error) {
            console.error("Nepodařilo se načíst uživatele pro projekt", error);
        }
    };

    const toggleMember = async (user: User, isCurrentlyMember: boolean) => {
        if (!selectedProject) return;

        try {
            if (isCurrentlyMember) {
                await ProjectMembersRepository.removeUserFromProject(selectedProject.id, user.id);
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

    const filteredUsers = allUsers.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(query) ||
            user.surname.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
    });

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Projects</h2>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                        >
                            + Add Project
                        </button>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#475569', cursor: 'pointer' }}>
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
                <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: message.includes("Error") ? '#f8d7da' : '#d4edda', color: '#721c24', borderRadius: '4px' }}>
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
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
                    />

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredUsers.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No users found.</div>
                        ) : (
                            filteredUsers.map(user => {
                                const isMember = projectMembers.some(pm => pm.id === user.id);

                                return (
                                    <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: isMember ? '#f0fdf4' : 'transparent' }}>

                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 500, color: '#1e293b' }}>{user.name} {user.surname}</span>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.email}</span>
                                        </div>

                                        <button
                                            onClick={() => toggleMember(user, isMember)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                                fontSize: '0.85rem',
                                                border: isMember ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                                                backgroundColor: isMember ? '#fef2f2' : '#ffffff',
                                                color: isMember ? '#ef4444' : '#334155'
                                            }}
                                        >
                                            {isMember ? "Remove" : "Add"}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                        <span>Total assigned: <strong>{projectMembers.length}</strong></span>
                        <button onClick={() => setIsMembersModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#334155', fontWeight: 500 }}>
                            Done
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};