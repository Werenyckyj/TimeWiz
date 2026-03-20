using System;
using AutoMapper;
using Timesheet.Data.Models;
using Timesheet.Data.Dtos.User;

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
