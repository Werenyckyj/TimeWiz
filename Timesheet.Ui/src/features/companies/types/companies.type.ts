export interface Companies {
    count: number;
    data: Company[];
}

export interface Company {
    id: string;
    name: string;
    cin: string;
}