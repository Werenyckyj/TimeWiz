import { createContext } from "react";
import { type Projects, type Project } from "../types/projects.type";

interface ProjectsContextType {
    getProjects: () => Promise<void>;
    projects: Projects;
    editProject: (project: Project) => Promise<void>;
    deleteProject: (projectId: number) => Promise<void>;
    addProject: (project: Omit<Project, "id">) => Promise<Project>;
    getUserProjects: (userId: number) => Promise<void>;
}

export const ProjectsContext = createContext<ProjectsContextType | null>(null);