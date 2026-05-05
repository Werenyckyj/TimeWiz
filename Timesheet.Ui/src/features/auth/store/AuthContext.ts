import { createContext } from "react";

interface UserTokenData {
    nameid: string;
    unique_name: string;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserTokenData | null;
    login: (accessToken: string, refreshToken: string) => void;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
export type { UserTokenData };
