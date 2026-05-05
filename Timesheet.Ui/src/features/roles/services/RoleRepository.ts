import api from "../../../shared/api/axiosInstance";
import type { Roles } from "../types/role.type";

export const RoleRepository = {
    getRoles: async (): Promise<Roles> => {
        const response = await api.get("/role");
        return response.data;
    }
}