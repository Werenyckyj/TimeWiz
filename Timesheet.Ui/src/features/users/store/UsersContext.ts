import { createContext } from "react";
import { type Users, type User, type EditUser, type AddUser } from "../types/users.type";

interface UsersContextType {
    getUsers: () => Promise<void>;
    users: Users;
    editUser: (user: EditUser) => Promise<void>;
    deleteUser: (userId: number) => Promise<void>;
    addUser: (user: AddUser) => Promise<User>;
}

export const UsersContext = createContext<UsersContextType | null>(null);