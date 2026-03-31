import type { Role } from "../../../shared/types/role.type";

export interface Users {
    count: number;
    data: User[];
}

export interface User {
    id: number;
    name: string;
    surname: string;
    username: string;
    email: string;
    isActive: boolean
    role: Role;
    // list of projects
}