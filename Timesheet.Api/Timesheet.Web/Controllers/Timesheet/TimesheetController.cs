using System;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Timesheet.Core;
using Timesheet.Core.Services.Mail;
using Timesheet.Core.Services.Timesheet;
using Timesheet.Data.Dtos;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Admin, Manager, Employee, Externist")]
public class TimesheetController(ILogger<TimesheetController> logger, ITRepository<TsWeek> repository, IMapper mapper, UnitOfWork unitOfWork, ITimesheetService timesheetService) : GenericController<TsWeek, TsWeekWDto, TsWeekRDto>(logger, repository, mapper)
{
    private readonly UnitOfWork _unitOfWork = unitOfWork;
    private readonly ITimesheetService _timesheetService = timesheetService;

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TsWeekRDto>), StatusCodes.Status200OK)]
    public override IActionResult GetAll()
    {
        var entities = _tRepository.GetAll()
                                .Include(t => t.Project)
                                .Include(t => t.User)
                                .Include(t => t.TsEntries)
                                .AsEnumerable();

        var responses = _mapper.Map<IEnumerable<TsWeekRDto>>(entities).ToList();
        return Ok(new { count = responses.Count, data = responses });
    }

    [HttpPost]
    [ProducesResponseType(typeof(TsWeekRDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public override IActionResult Create([FromBody] TsWeekWDto dto)
    {
        var user = _unitOfWork.UserRepository.GetById(dto.UserId);
        if (user == null) return NotFound($"User with ID {dto.UserId} not found.");

        var project = _unitOfWork.ProjectRepository.GetById(dto.ProjectId);
        if (project == null) return NotFound($"Project with ID {dto.ProjectId} not found.");

        var userProject = _unitOfWork.UserProjectRepository
            .Where(up => up.UserId == dto.UserId && up.ProjectId == dto.ProjectId)
            .FirstOrDefault();
        if (userProject == null) return BadRequest($"User with ID {dto.UserId} is not assigned to Project with ID {dto.ProjectId}.");

        var existingTsWeek = _unitOfWork.TsWeekRepository
            .Where(t => t.UserId == dto.UserId && t.Year == dto.Year && t.WeekNumber == dto.WeekNumber && t.ProjectId == dto.ProjectId)
            .FirstOrDefault();

        if (existingTsWeek != null)
        {
            _logger.LogWarning($"Attempt to create duplicate timesheet for User ID {dto.UserId}, Year {dto.Year}, Week {dto.WeekNumber}.");
            return BadRequest($"Timesheet for User ID {dto.UserId}, Year {dto.Year}, Week {dto.WeekNumber} already exists.");
        }

        var tsWeek = _mapper.Map<TsWeek>(dto);
        var week = _unitOfWork.TsWeekRepository.Add(tsWeek);
        _unitOfWork.SaveChanges();

        for (int i = 0; i < dto.DaysInWeek; i++)
        {
            var entry = new TsEntry
            {
                TsWeekId = week.Entity.Id,
                WorkDate = dto.StartDate.AddDays(i),
                Hours = 0,
                TsWeek = week.Entity
            };
            _unitOfWork.TsEntryRepository.Add(entry);
        }
        _logger.LogInformation($"Created timesheet with ID {week.Entity.Id} for User ID {dto.UserId}, Year {dto.Year}, Week {dto.WeekNumber}, with {dto.DaysInWeek} entries.");
        _unitOfWork.SaveChanges();

        var responseDto = _mapper.Map<TsWeekRDto>(week.Entity);
        return CreatedAtAction(nameof(GetById), new { id = tsWeek.Id }, responseDto);
    }

    [NonAction]
    public override IActionResult Update(int id, [FromBody] TsWeekWDto dto)
    {
        return base.Update(id, dto);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(TsWeekRDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] TsWeekWDto dto)
    {
        var existingTsWeek = _unitOfWork.TsWeekRepository.Query()
            .Include(t => t.Approval)
            .ThenInclude(a => a.Managers)
            .Include(t => t.TsEntries)
            .FirstOrDefault(t => t.Id == id);

        if (existingTsWeek == null) return NotFound($"Timesheet with ID {id} not found.");

        var user = _unitOfWork.UserRepository.GetById(dto.UserId);
        if (user == null) return NotFound($"User with ID {dto.UserId} not found.");

        var project = _unitOfWork.ProjectRepository.GetById(dto.ProjectId);
        if (project == null) return NotFound($"Project with ID {dto.ProjectId} not found.");

        var oldStatus = existingTsWeek.Status;
        var newStatus = dto.Status;

        existingTsWeek.Status = dto.Status;
        existingTsWeek.Comment = dto.Comment;

        foreach (var incomingEntry in dto.TsEntries)
        {
            var existingEntry = existingTsWeek.TsEntries.FirstOrDefault(e => e.WorkDate.Date == incomingEntry.WorkDate.Date);

            if (existingEntry != null)
            {
                existingEntry.Hours = incomingEntry.Hours;
            }
        }

        var updatedTsWeek = _unitOfWork.TsWeekRepository.Update(existingTsWeek);

        if (oldStatus != newStatus)
        {
            if (!_timesheetService.ManageApproval(oldStatus, newStatus, existingTsWeek, dto))
                return NotFound("User not found when managing approval.");
        }
        _unitOfWork.SaveChanges();

        if (oldStatus != TsWeekStatus.Submitted && newStatus == TsWeekStatus.Submitted)
        {
            await _timesheetService.SendMailToManager(existingTsWeek);
        }
        else if (oldStatus != TsWeekStatus.Rejected && newStatus == TsWeekStatus.Rejected)
        {
            await _timesheetService.SendMailToEmployee(existingTsWeek);
        }

        var responseDto = _mapper.Map<TsWeekRDto>(updatedTsWeek.Entity);
        return Ok(responseDto);
    }

    [HttpGet("report")]
    [ProducesResponseType(typeof(List<TsWeekRDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult GetReport(
        [FromQuery] List<int>? projectIds,
        [FromQuery] List<int>? userIds,
        [FromQuery] List<int>? companyIds,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] List<TsWeekStatus>? statuses)
    {
        if (!dateFrom.HasValue || !dateTo.HasValue)
        {
            return BadRequest("Both dateFrom and dateTo query parameters are required.");
        }

        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        var query = _unitOfWork.TsWeekRepository.Query()
            .AsNoTracking()
            .Include(t => t.TsEntries)
            .Include(t => t.Project)
            .Include(t => t.User)
            .AsQueryable();

        if (currentUserRole != "Admin")
        {
            bool isPersonalReportOnly = userIds != null && userIds.Count == 1 && userIds.Contains(currentUserId);

            if (isPersonalReportOnly)
            {
                query = query.Where(t => t.UserId == currentUserId);

                if (projectIds != null && projectIds.Any())
                {
                    query = query.Where(t => projectIds.Contains(t.ProjectId));
                }
            }
            else
            {
                var managedProjectIds = _unitOfWork.UserProjectRepository.Query()
                    .Where(up => up.UserId == currentUserId && up.ProjectRole == RoleTypes.Manager)
                    .Select(up => up.ProjectId)
                    .ToList();

                if (projectIds != null && projectIds.Any())
                {
                    projectIds = projectIds.Intersect(managedProjectIds).ToList();
                    if (!projectIds.Any()) return Ok(new List<TsWeekRDto>());
                }
                else
                {
                    projectIds = managedProjectIds;
                }

                query = query.Where(t => projectIds.Contains(t.ProjectId));
            }
        }
        else
        {
            if (projectIds != null && projectIds.Any())
            {
                query = query.Where(t => projectIds.Contains(t.ProjectId));
            }
        }

        if (userIds != null && userIds.Any())
            query = query.Where(t => userIds.Contains(t.UserId));

        if (companyIds != null && companyIds.Any())
        {
            var includeNoCompany = companyIds.Contains(0);
            var filteredCompanyIds = companyIds.Where(id => id != 0).ToList();

            query = query.Where(t =>
                (includeNoCompany && !t.User.CompanyId.HasValue)
                || (t.User.CompanyId.HasValue && filteredCompanyIds.Contains(t.User.CompanyId.Value)));
        }

        if (dateFrom.HasValue)
            query = query.Where(t => t.TsEntries.Any(e => e.WorkDate >= dateFrom.Value));

        if (dateTo.HasValue)
            query = query.Where(t => t.TsEntries.Any(e => e.WorkDate <= dateTo.Value));

        if (statuses != null && statuses.Any())
            query = query.Where(t => statuses.Contains(t.Status));

        var timesheets = query.ToList();
        var response = _mapper.Map<List<TsWeekRDto>>(timesheets);
        return Ok(response);
    }

}