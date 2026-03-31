import api from "../../../shared/api/axiosInstance";
import type { Users, User } from "../types/users.type";

export const UsersRepository = {
    getUsers: async (): Promise<Users> => {
        const response = await api.get<Users>("/user");
        return response.data;
    },
    editUser: async (user: User): Promise<void> => {
        await api.put(`/user/${user.id}`, user);
    },
    deleteUser: async (userId: number): Promise<void> => {
        await api.delete(`/user/${userId}`);
    },
    addUser: async (user: Omit<User, "id">): Promise<User> => {
        const response = await api.post<User>("/doesnotworkě", user);
        return response.data;
    }
};