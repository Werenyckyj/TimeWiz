
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Timesheet.Core;
using Timesheet.Data.Dtos.Role;
using Timesheet.Data.Models;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RoleController : GenericController<Role, RoleWDto, RoleRDto>
{
    public RoleController(ILogger<RoleController> logger, ITRepository<Role> tRepository, IMapper mapper) : base(logger, tRepository, mapper)
    {
    }

}
