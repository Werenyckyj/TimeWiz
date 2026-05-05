import type { Role } from "../../features/roles/types/role.type";

export interface UserProject {
    id: number;
    userId: number;
    projectId: number;
    role: Role;
}