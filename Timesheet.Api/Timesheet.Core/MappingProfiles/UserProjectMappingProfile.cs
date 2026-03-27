using System;
using AutoMapper;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Core.MappingProfiles;

public class UserProjectMappingProfile : Profile
{
    public UserProjectMappingProfile()
    {
        CreateMap<UserProject, UserProjectRDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.ProjectId, opt => opt.MapFrom(src => src.ProjectId))
            .ForMember(dest => dest.ProjectRole, opt => opt.MapFrom(src => src.ProjectRole));
    }
}
