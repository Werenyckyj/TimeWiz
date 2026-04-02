import { type ReactNode, useCallback, useState } from "react";
import { UsersContext } from "./UsersContext";
import { UsersRepository } from "../services/UsersRepository";
import type { AddUser, EditUser, Users } from "../types/users.type";

export const UsersProvider = ({ children }: { children: ReactNode }) => {
    const [users, setUsers] = useState<Users>({ data: [] } as unknown as Users);

    const getUsers = useCallback(async () => {
        const data = await UsersRepository.getUsers();
        setUsers(data);
    }, []);

    const editUser = async (user: EditUser) => {
        const updated = await UsersRepository.editUser(user);
        setUsers(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
                ...prev,
                data: prev.data.map(u => u.id === updated.id ? updated : u)
            };
        });
    };

    const deleteUser = async (userId: number) => {
        await UsersRepository.deleteUser(userId);
        setUsers(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
                ...prev,
                data: prev.data.filter(u => u.id !== userId)
            };
        });
    };

    const addUser = async (user: AddUser) => {
        const newUser = await UsersRepository.addUser(user);

        setUsers(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
                ...prev,
                data: [...prev.data, newUser]
            };
        });

        return newUser;
    };

    return (
        <UsersContext.Provider value={{
            users,
            getUsers,
            editUser,
            deleteUser,
            addUser
        }}>
            {children}
        </UsersContext.Provider>
    );
};