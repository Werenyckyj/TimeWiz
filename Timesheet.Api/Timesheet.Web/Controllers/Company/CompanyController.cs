using System;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Timesheet.Core;
using Timesheet.Data.Dtos;
using Timesheet.Data.Models;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Admin, Manager, Externist")]
public class CompanyController(ILogger<CompanyController> logger, ITRepository<Company> tRepository, IMapper mapper) : GenericController<Company, CompanyWDto, CompanyRDto>(logger, tRepository, mapper)
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public override IActionResult GetAll()
    {
        var entities = _tRepository.GetAll()
                                .Include(c => c.Employees)
                                .AsEnumerable();

        var responses = _mapper.Map<IEnumerable<CompanyRDto>>(entities).ToList();
        return Ok(new { count = responses.Count, data = responses });
    }
}
