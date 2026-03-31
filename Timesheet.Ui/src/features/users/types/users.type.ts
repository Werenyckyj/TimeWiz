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
    // list of projects
}