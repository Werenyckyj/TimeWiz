
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
public class RoleController(ILogger<RoleController> logger, ITRepository<Role> tRepository, IMapper mapper) : GenericController<Role, RoleWDto, RoleRDto>(logger, tRepository, mapper)
{
}
