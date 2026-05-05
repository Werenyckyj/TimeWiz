using AutoMapper;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Core.MappingProfiles;

public class RoleMappingPtrofile : Profile
{
    public RoleMappingPtrofile()
    {
        CreateMap<RoleWDto, Role>();
        CreateMap<Role, RoleRDto>();
    }
}