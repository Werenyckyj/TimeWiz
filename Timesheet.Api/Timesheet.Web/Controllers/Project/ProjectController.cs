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
[Authorize(Roles = "Manager, Admin")]
public class ProjectController(ILogger<ProjectController> logger, ITRepository<Project> tRepository, IMapper mapper) : GenericController<Project, ProjectWDto, ProjectRDto>(logger, tRepository, mapper)
{

}
