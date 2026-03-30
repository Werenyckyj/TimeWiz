import { useState, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext, type UserTokenData } from "./AuthContext";
import { AuthRepository } from "../services/AuthRepository";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const getUserFromToken = (): UserTokenData | null => {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;
        try {
            return jwtDecode<UserTokenData>(token);
        } catch {
            return null;
        }
    };

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem("accessToken"));
    const [user, setUser] = useState<UserTokenData | null>(getUserFromToken());

    const login = (accessToken: string, refreshToken: string) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        setIsAuthenticated(true);
        setUser(jwtDecode<UserTokenData>(accessToken));
    }

    const logout = async () => {
        try {
            await AuthRepository.revoke();
        } catch (error) {
            console.error("Logout error:", error);
        }
        finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setIsAuthenticated(false);
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}