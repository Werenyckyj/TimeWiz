using System;
using AutoMapper;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Core.MappingProfiles;

public class TsWeekMappingProfile : Profile
{
    public TsWeekMappingProfile()
    {
        CreateMap<TsWeek, TsWeekRDto>();
        CreateMap<TsWeekRDto, TsWeek>();

        CreateMap<TsWeek, TsWeekWDto>();
        CreateMap<TsWeekWDto, TsWeek>();
    }
}
