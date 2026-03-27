import api from "../../../shared/api/axiosInstance";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export const AuthRepository = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>("/auth/login", credentials);
        return response.data;
    }
};