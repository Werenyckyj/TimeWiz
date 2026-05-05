using System;
using AutoMapper;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Core.MappingProfiles;

public class CompanyMappingProfile : Profile
{
    public CompanyMappingProfile()
    {
        CreateMap<Company, CompanyRDto>();
        CreateMap<CompanyWDto, Company>();
        CreateMap<Company, CompanySimpleRDto>();
    }
}
