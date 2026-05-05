export interface Role {
    id: number;
    name: string;
    privilege: string;
}

export interface Roles {
    count: number;
    data: Role[];
}