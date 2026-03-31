import { createContext } from "react";
import { type Users, type User } from "../types/users.type";

interface UsersContextType {
    getUsers: () => Promise<void>;
    users: Users;
    editUser: (user: User) => Promise<void>;
    deleteUser: (userId: number) => Promise<void>;
    addUser: (user: Omit<User, "id">) => Promise<User>;
}

export const UsersContext = createContext<UsersContextType | null>(null);