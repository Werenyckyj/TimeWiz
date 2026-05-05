export interface Role {
    id: number;
    name: string;
    Privileges: string;
}

export interface Roles {
    count: number;
    data: Role[];
}