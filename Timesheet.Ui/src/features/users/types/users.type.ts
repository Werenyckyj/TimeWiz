import type { Company } from "../../companies/types/companies.type";
import type { Role } from "../../roles/types/role.type";
import type { UserProject } from "../../../shared/types/userProject.type";

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
    roleId?: number | null;
    company?: Company;
    companyId?: number | null;
    projectMemberships?: UserProject[];
}

export interface EditUser {
    id: number;
    name: string;
    surname: string;
    username: string;
    email: string;
    isActive: boolean
    roleId: number | null;
    companyId?: number | null;
}

export interface AddUser {
    name: string;
    surname: string;
    username: string;
    email: string;
    password: string;
    roleId: number | null;
    companyId?: number | null;
}

export interface ChangeUserPassword {
    userId: number;
    oldPassword: string;
    newPassword: string;
}