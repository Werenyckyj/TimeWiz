import type { TsEntry } from "../../../shared/types/tsEntry.type";
import type { Project } from "../../projects/types/projects.type";

export interface TsWeek {
    id: number,
    project: Project,
    userId: number,
    year: number,
    weekNumber: number,
    comment: string,
    status: string,
    tsEntries: TsEntry[],
};

export interface EditTsWeek {
    projectId: number,
    userId: number,
    daysInWeek: number,
    startDate: string,
    year: number,
    weekNumber: number,
    comment: string,
    status: string,
    tsEntries: TsEntry[],
}

export interface RawTsWeek {
    id: number,
    week: string,
    year: number,
    Mo: number,
    Tu: number,
    We: number,
    Th: number,
    Fr: number,
    Sa: number,
    Su: number,
}