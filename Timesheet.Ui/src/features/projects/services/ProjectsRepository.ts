import api from '../../../shared/api/axiosInstance';
import type { Projects, Project } from '../types/projects.type';

export const ProjectsRepository = {
    getProjects: async () => {
        const response = await api.get<Projects>('/project');
        return response.data;
    },
    editProject: async (user: Project): Promise<Project> => {
        const response = await api.put<Project>(`/project/${user.id}`, user);
        return response.data;
    },
    deleteProject: async (projectId: number): Promise<void> => {
        await api.delete(`/project/${projectId}`);
    },
    addProject: async (project: Omit<Project, 'id'>): Promise<Project> => {
        const response = await api.post<Project>('/project', project);
        return response.data;
    },
    getUserProjects: async (userId: number): Promise<Project[]> => {
        const response = await api.get(`/user/${userId}/projects`);
        return response.data;
    }
};