using System;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    [HttpPost]
    [ProducesResponseType(typeof(TsWeekRDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public override IActionResult Create([FromBody] TsWeekWDto dto)
    {
        var user = _unitOfWork.UserRepository.GetById(dto.UserId);
        if (user == null) return NotFound($"User with ID {dto.UserId} not found.");

        var existingTsWeek = _unitOfWork.TsWeekRepository
            .Where(t => t.UserId == dto.UserId && t.Year == dto.Year && t.WeekNumber == dto.WeekNumber)
            .FirstOrDefault();

        if (existingTsWeek != null)
        {
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
        _unitOfWork.SaveChanges();

        var responseDto = _mapper.Map<TsWeekRDto>(tsWeek);
        return CreatedAtAction(nameof(GetById), new { id = tsWeek.Id }, responseDto);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(TsWeekRDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] TsWeekWDto dto)
    {
        var existingTsWeek = _unitOfWork.TsWeekRepository.GetById(id);
        if (existingTsWeek == null) return NotFound($"Timesheet with ID {id} not found.");

        var user = _unitOfWork.UserRepository.GetById(dto.UserId);
        if (user == null) return NotFound($"User with ID {dto.UserId} not found.");

        var isNewlySubmitted = existingTsWeek.Status != TsWeekStatus.Submitted && dto.Status == TsWeekStatus.Submitted;
        var isStatusChangedToRejected = existingTsWeek.Status != TsWeekStatus.Rejected && dto.Status == TsWeekStatus.Rejected;

        _mapper.Map(dto, existingTsWeek);
        var updatedTsWeek = _unitOfWork.TsWeekRepository.Update(existingTsWeek);
        if (!ManageApproval(isNewlySubmitted, isStatusChangedToRejected, existingTsWeek, dto)) return NotFound("User not found when managing approval.");
        _unitOfWork.SaveChanges();

        if (isNewlySubmitted) await SendMailToManager(existingTsWeek);
        else if (isStatusChangedToRejected) await SendMailToEmployee(existingTsWeek);

        var responseDto = _mapper.Map<TsWeekRDto>(updatedTsWeek.Entity);
        return Ok(responseDto);
    }

    public bool ManageApproval(bool isNewlySubmitted, bool isStatusChangedToRejected, TsWeek existingTsWeek, TsWeekWDto dto)
    {
        TsApproval? newApproval = null;
        if (isNewlySubmitted || isStatusChangedToRejected)
        {
            var user = _unitOfWork.UserRepository.GetById(dto.UserId);
            if (user == null)
            {
                _logger.LogError($"User with ID {dto.UserId} not found when managing approval.");
                return false;
            }

            newApproval = new TsApproval
            {
                TsWeekId = existingTsWeek.Id,
                TsWeek = existingTsWeek,
                UserId = dto.UserId,
                User = user,
                ActionTime = DateTime.UtcNow,
                Action = isNewlySubmitted ? TsApprovalStatus.Pending : (isStatusChangedToRejected ? TsApprovalStatus.Rejected : TsApprovalStatus.Approved),
                Comment = isStatusChangedToRejected ? dto.Comment : null,
                Managers = [.. _unitOfWork.UserRepository.Where(u => u.UserProjects.
                    Any(up => up.ProjectId == existingTsWeek.ProjectId && up.ProjectRole == RoleTypes.Manager))]
            };

            _unitOfWork.TsApprovalRepository.Add(newApproval);
        }
        return true;
    }

    public async Task SendMailToManager(TsWeek tsWeek)
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

    public async Task SendMailToEmployee(TsWeek tsWeek)
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
