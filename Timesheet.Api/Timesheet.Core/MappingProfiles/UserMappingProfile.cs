using System;
using AutoMapper;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Core.MappingProfiles;

public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        CreateMap<User, UserRDto>();
        CreateMap<UserRDto, User>();

        CreateMap<User, UserWDto>();
        CreateMap<UserWDto, User>();
    }
}
