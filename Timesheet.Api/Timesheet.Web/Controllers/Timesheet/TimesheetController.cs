using System;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Timesheet.Core;
using Timesheet.Core.Services.Mail;
using Timesheet.Data.Dtos;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Admin, Manager, Emploeyee, Externist")]
public class TimesheetController(ILogger<TimesheetController> logger, ITRepository<TsWeek> repository, IMapper mapper, UnitOfWork unitOfWork, IMailService mailService) : GenericController<TsWeek, TsWeekWDto, TsWeekRDto>(logger, repository, mapper)
{
    private readonly UnitOfWork _unitOfWork = unitOfWork;
    private readonly IMailService _mailService = mailService;

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

        var isNewlySubmitted = existingTsWeek.Status != TsWeekStatus.Submitted && dto.Status == TsWeekStatus.Submitted;
        var isStatusChanged = existingTsWeek.Status != TsWeekStatus.Rejected && (dto.Status == TsWeekStatus.Rejected || dto.Status == TsWeekStatus.Approved);

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

        if (!ManageApproval(isNewlySubmitted, isStatusChanged, existingTsWeek, dto)) return NotFound("User not found when managing approval.");

        _unitOfWork.SaveChanges();

        if (isNewlySubmitted) await SendMailToManager(existingTsWeek);
        else if (isStatusChanged) await SendMailToEmployee(existingTsWeek);

        var responseDto = _mapper.Map<TsWeekRDto>(updatedTsWeek.Entity);
        return Ok(responseDto);
    }

    [HttpGet("report")]
    [ProducesResponseType(typeof(List<TsWeekRDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult GetReport(
        [FromQuery] int? projectId,
        [FromQuery] int? userId,
        [FromQuery] int? companyId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {

        if (!dateFrom.HasValue || !dateTo.HasValue)
        {
            return BadRequest("Both dateFrom and dateTo query parameters are required.");
        }

        var query = _unitOfWork.TsWeekRepository.Query()
            .AsNoTracking()
            .Include(t => t.TsEntries)
            .Include(t => t.Project)
            .Include(t => t.User)
            .AsQueryable();

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        if (userId.HasValue)
            query = query.Where(t => t.UserId == userId.Value);

        if (companyId.HasValue)
            query = query.Where(t => t.User.CompanyId == companyId.Value);

        if (dateFrom.HasValue)
            query = query.Where(t => t.TsEntries.Any(e => e.WorkDate >= dateFrom.Value));

        if (dateTo.HasValue)
            query = query.Where(t => t.TsEntries.Any(e => e.WorkDate <= dateTo.Value));

        var timesheets = query.ToList();

        var response = _mapper.Map<List<TsWeekRDto>>(timesheets);
        return Ok(response);
    }

    private bool ManageApproval(bool isNewlySubmitted, bool isStatusChanged, TsWeek existingTsWeek, TsWeekWDto dto)
    {
        if (isNewlySubmitted || isStatusChanged)
        {
            var user = _unitOfWork.UserRepository.GetById(dto.UserId);
            if (user == null)
            {
                _logger.LogError($"User with ID {dto.UserId} not found when managing approval.");
                return false;
            }

            var newStatus = isNewlySubmitted ? TsApprovalStatus.Pending : (isStatusChanged ? TsApprovalStatus.Rejected : TsApprovalStatus.Approved);

            var currentManagers = _unitOfWork.UserRepository.Where(u => u.UserProjects
                .Any(up => up.ProjectId == existingTsWeek.ProjectId && up.ProjectRole == RoleTypes.Manager)).ToList();

            if (existingTsWeek.Approval != null)
            {
                existingTsWeek.Approval.ActionTime = DateTime.UtcNow;
                existingTsWeek.Approval.Action = newStatus;
                existingTsWeek.Approval.Comment = isStatusChanged ? dto.Comment : null;

                existingTsWeek.Approval.Managers.Clear();
                foreach (var manager in currentManagers)
                {
                    existingTsWeek.Approval.Managers.Add(manager);
                }
            }
            else
            {
                existingTsWeek.Approval = new TsApproval
                {
                    TsWeekId = existingTsWeek.Id,
                    ActionTime = DateTime.UtcNow,
                    Action = newStatus,
                    Comment = isStatusChanged ? dto.Comment : null,
                    Managers = currentManagers,
                    TsWeek = existingTsWeek,
                };
            }
        }
        return true;
    }

    private async Task SendMailToManager(TsWeek tsWeek)
    {
        var managers = _unitOfWork.UserRepository.Where(u => u.UserProjects.
            Any(up => up.ProjectId == tsWeek.ProjectId && up.ProjectRole == RoleTypes.Manager)).ToList();

        foreach (var manager in managers)
        {
            var subject = $"Timesheet Submitted: {tsWeek.User.Name} {tsWeek.User.Surname} - Week {tsWeek.WeekNumber}, {tsWeek.Year}";
            var body = $"Dear {manager.Name} {manager.Surname},\n\n" +
                    $"The timesheet for {tsWeek.User.Name} {tsWeek.User.Surname} has been submitted for Week {tsWeek.WeekNumber}, {tsWeek.Year}.\n\n" +
                    $"Please review and approve it at your earliest convenience.\n\n" +
                    $"Best regards,\nTimesheet App";

            await _mailService.SendAsync(manager.Email, subject, body);
        }
    }

    private async Task SendMailToEmployee(TsWeek tsWeek)
    {
        var employee = _unitOfWork.UserRepository.GetById(tsWeek.UserId);
        if (employee == null) return;

        var subject = $"Timesheet Rejected: {tsWeek.User.Name} {tsWeek.User.Surname} - Week {tsWeek.WeekNumber}, {tsWeek.Year}";
        var body = $"Dear {employee.Name} {employee.Surname},\n\n" +
                $"Your timesheet for Week {tsWeek.WeekNumber}, {tsWeek.Year} has been rejected.\n\n" +
                $"Reason for rejection: {tsWeek.Approval.Comment}\n\n" +
                $"Best regards,\nTimesheet App";

        await _mailService.SendAsync(employee.Email, subject, body);
    }
}
