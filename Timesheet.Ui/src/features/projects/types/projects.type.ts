export interface Project {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
    validFrom: Date;
    validTo: Date;
}

export interface Projects {
    count: number;
    data: Project[];
}