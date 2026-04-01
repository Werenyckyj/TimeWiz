import api from "../../../shared/api/axiosInstance";
import type { User } from "../../users/types/users.type";

export const ProjectMembersRepository = {
    getProjectUsers: async (projectId: number): Promise<User[]> => {
        const response = await api.get(`/project/${projectId}/users`);
        return response.data.data || response.data;
    },

    addUserToProject: async (projectId: number, userId: number): Promise<void> => {
        await api.post(`/project/${projectId}/assign`, userId);
    },

    removeUserFromProject: async (projectId: number, userId: number): Promise<void> => {
        await api.post(`/project/${projectId}/unassign`, userId);
    }
};