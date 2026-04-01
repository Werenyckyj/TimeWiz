import { type ReactNode, useCallback, useState } from 'react';
import { type Projects, type Project } from '../types/projects.type';
import { ProjectsContext } from './ProjectsContext';
import { ProjectsRepository } from '../services/ProjectsRepository';

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
    const [projects, setProjects] = useState<Projects>({ data: [] } as unknown as Projects);

    const getProjects = useCallback(async () => {
        const data = await ProjectsRepository.getProjects();
        setProjects(data);
    }, []);

    const editProject = async (project: Project) => {
        const updated = await ProjectsRepository.editProject(project);
        setProjects(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
                ...prev,
                data: prev.data.map(p => p.id === updated.id ? updated : p)
            };
        });
    };

    const deleteProject = async (projectId: number) => {
        await ProjectsRepository.deleteProject(projectId);
        setProjects(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
                ...prev,
                data: prev.data.filter(p => p.id !== projectId)
            };
        });
    };

    const addProject = async (project: Omit<Project, "id">) => {
        const newProject = await ProjectsRepository.addProject(project);

        setProjects(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
                ...prev,
                data: [...prev.data, newProject]
            };
        });

        return newProject;
    };

    return (
        <ProjectsContext.Provider value={{
            projects,
            getProjects,
            editProject,
            deleteProject,
            addProject
        }}>
            {children}
        </ProjectsContext.Provider>
    );
}