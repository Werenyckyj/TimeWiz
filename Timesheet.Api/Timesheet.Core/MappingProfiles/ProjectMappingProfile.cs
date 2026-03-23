using System;
using AutoMapper;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Core.MappingProfiles;

public class ProjectMappingProfile : Profile
{
    public ProjectMappingProfile()
    {
        CreateMap<Project, ProjectRDto>();
        CreateMap<ProjectRDto, Project>();

        CreateMap<Project, ProjectWDto>();
        CreateMap<ProjectWDto, Project>();
    }
}
