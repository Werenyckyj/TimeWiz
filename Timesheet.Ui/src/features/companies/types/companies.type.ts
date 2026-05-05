import type { User } from "../../users/types/users.type";

export interface Companies {
    count: number;
    data: Company[];
}

export interface Company {
    id: number;
    name: string;
    cin: string;
    employees?: User[]
}