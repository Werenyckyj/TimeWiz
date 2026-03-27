using System;
using AutoMapper;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Core.MappingProfiles;

public class TsEntryMappingProfile : Profile
{
    public TsEntryMappingProfile()
    {
        CreateMap<TsEntry, TsEntryRDto>();
        CreateMap<TsEntryRDto, TsEntry>();

        CreateMap<TsEntry, TsEntryWDto>();
        CreateMap<TsEntryWDto, TsEntry>();
    }
}
