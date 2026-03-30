import api from "../../../shared/api/axiosInstance";
import type { LoginRequest, LoginResponse, RevokeRequest } from "../types/auth.types";

export const AuthRepository = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>("/auth/login", credentials);
        return response.data;
    },

    revoke: async (): Promise<string> => {
        const tokens: RevokeRequest = {
            accessToken: localStorage.getItem("accessToken") || "",
            refreshToken: localStorage.getItem("refreshToken") || ""
        };
        if (!tokens.accessToken || !tokens.refreshToken) return "No tokens to revoke";

        const response = await api.post("/auth/revoke", tokens);
        return response.data;
    }
};