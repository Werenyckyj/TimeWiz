using System;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Timesheet.Core;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class CompanyController(ILogger<CompanyController> logger, ITRepository<Company> tRepository, IMapper mapper) : GenericController<Company, CompanyWDto, CompanyRDto>(logger, tRepository, mapper)
{

}
