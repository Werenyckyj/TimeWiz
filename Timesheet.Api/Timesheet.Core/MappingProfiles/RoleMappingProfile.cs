using System;
using AutoMapper;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Core.MappingProfiles;

public class RoleMappingProfile : Profile
{
    public RoleMappingProfile()
    {
        CreateMap<Role, RoleRDto>();
        CreateMap<RoleRDto, Role>();

        CreateMap<Role, RoleWDto>();
        CreateMap<RoleWDto, Role>();
    }
}
