import { UsersRepository } from "../../features/users/services/UsersRepository";
import { ProjectsRepository } from "../../features/projects/services/ProjectsRepository";
import { ProjectMembersRepository } from "../../features/projects/services/ProjectMembersRepository";

export async function canApprove(userId: number): Promise<boolean> {
    try {
        const user = await UsersRepository.getUser(userId);

        if (!user || user.role.privilege !== 'Externist') {
            return false;
        }

        const userProjects = await ProjectsRepository.getUserProjects(userId);

        if (!userProjects || userProjects.length === 0) {
            return false;
        }

        const checkResults = await Promise.all(
            userProjects.map(async (project) => {
                const managers = await ProjectMembersRepository.getProjectManagers(project.id);
                return managers.some(m => m.id === userId);
            })
        );

        const isManagerInAnyProject = checkResults.some(result => result === true);

        return isManagerInAnyProject;
    } catch (error) {
        console.error('Error checking if user can approve:', error);
        return false;
    }
}
