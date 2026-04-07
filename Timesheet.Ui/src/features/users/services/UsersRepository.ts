import api from "../../../shared/api/axiosInstance";
import type { Users, User, EditUser, AddUser, ChangeUserPassword } from "../types/users.type";

export const UsersRepository = {
    getUsers: async (): Promise<Users> => {
        const response = await api.get<Users>("/user");
        return response.data;
    },
    editUser: async (user: EditUser): Promise<User> => {
        const response = await api.put<User>(`/user/${user.id}`, user);
        return response.data;
    },
    deleteUser: async (userId: number): Promise<void> => {
        await api.delete(`/user/${userId}`);
    },
    addUser: async (user: AddUser): Promise<User> => {
        const response = await api.post<User>("/auth/register", user);
        return response.data;
    },
    getUser: async (id: number): Promise<User> => {
        const response = await api.get(`/user/${id}`);
        return response.data.data || response.data;
    },
    changeUserPassword: async (payload: ChangeUserPassword): Promise<void> => {
        await api.post(`/user/${payload.userId}/change-password`, { newPassword: payload.newPassword, oldPassword: payload.oldPassword });
    }
};