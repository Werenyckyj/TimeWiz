using System;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Timesheet.Core;
using Timesheet.Data.Dtos;
using Timesheet.Data.Dtos.Page;
using Timesheet.Data.Models;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class UserController(ILogger<UserController> logger, ITRepository<User> tRepository, IMapper mapper, UnitOfWork unitOfWork) : GenericController<User, UserWDto, UserRDto>(logger, tRepository, mapper)
{
    private readonly UnitOfWork _unitOfWork = unitOfWork;

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public override IActionResult GetAll()
    {
        var entities = _tRepository.GetAll()
                                .Include(u => u.Role)
                                .Include(u => u.UserProjects)
                                .Include(u => u.Company)
                                .AsEnumerable();

        var responses = _mapper.Map<IEnumerable<UserRDto>>(entities).ToList();
        return Ok(new { count = responses.Count, data = responses });
    }

    [HttpGet("{id:int}/timesheets")]
    [ProducesResponseType(typeof(List<TsWeekRDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Roles = "Admin, Manager, Emploeyee, Externist")]
    public IActionResult GetUserTimesheets(int id, [FromQuery] int year, [FromQuery] int week)
    {
        if (_unitOfWork.UserRepository.GetById(id) is null)
        {
            return NotFound();
        }

        var timesheets = _unitOfWork.TsWeekRepository
            .Query()
            .Include(t => t.TsEntries)
            .Include(t => t.Project)
            .Where(t => t.UserId == id && t.Year == year && t.WeekNumber == week)
            .ToList();

        var response = _mapper.Map<List<TsWeekRDto>>(timesheets);
        return Ok(response);
    }

    [HttpGet("{id:int}/project-timesheets")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Roles = "Admin, Manager")]
    public IActionResult GetUserProjectTimesheets(int id, [FromQuery] int projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 3, [FromQuery] int? year = null, [FromQuery] int? week = null)
    {
        if (_unitOfWork.UserRepository.GetById(id) is null)
            return NotFound();

        if (_unitOfWork.ProjectRepository.GetById(projectId) is null)
            return NotFound();

        var query = _unitOfWork.TsWeekRepository.Query()
        .Include(t => t.TsEntries)
        .Where(ts => ts.UserId == id && ts.ProjectId == projectId);

        if (year.HasValue) query = query.Where(ts => ts.Year == year.Value);
        if (week.HasValue) query = query.Where(ts => ts.WeekNumber == week.Value);

        query = query
            .OrderByDescending(ts => ts.Year)
            .ThenByDescending(ts => ts.WeekNumber);

        var totalRecords = query.Count();

        var timesheets = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = _mapper.Map<IEnumerable<TsWeekRDto>>(timesheets);

        return Ok(new PaginatedResponse<TsWeekRDto>
        {
            TotalRecords = totalRecords,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalRecords / (double)pageSize),
            Data = [.. response]
        });
    }

    [HttpGet("{id:int}/projects")]
    [ProducesResponseType(typeof(List<ProjectRDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Roles = "Admin, Manager, Emploeyee, Externist")]
    public IActionResult GetUserProjects(int id)
    {
        if (_unitOfWork.UserRepository.GetById(id) is null)
        {
            return NotFound();
        }

        var projects = _unitOfWork.UserProjectRepository
        .Query()
        .Include(up => up.Project)
        .Where(up => up.UserId == id)
        .Select(up => up.Project)
        .ToList();

        var response = _mapper.Map<List<ProjectRDto>>(projects);
        return Ok(response);
    }
}
