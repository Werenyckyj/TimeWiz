using Microsoft.Extensions.Logging;
using Timesheet.Core.Services.Mail;
using Timesheet.Data.Dtos;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Core.Services.Timesheet;

public class TimesheetService(UnitOfWork unitOfWork, IMailService mailService, ILogger<TimesheetService> logger) : ITimesheetService
{
    private readonly UnitOfWork _unitOfWork = unitOfWork;
    private readonly IMailService _mailService = mailService;
    private readonly ILogger<TimesheetService> _logger = logger;
    public bool ManageApproval(TsWeekStatus oldStatus, TsWeekStatus newStatus, TsWeek existingTsWeek, TsWeekWDto dto)
    {
        var user = _unitOfWork.UserRepository.GetById(dto.UserId);
        if (user == null)
        {
            _logger.LogError($"User with ID {dto.UserId} not found when managing approval.");
            return false;
        }

        TsApprovalStatus? mappedAction = newStatus switch
        {
            TsWeekStatus.Submitted => TsApprovalStatus.Pending,
            TsWeekStatus.Approved => TsApprovalStatus.Approved,
            TsWeekStatus.Rejected => TsApprovalStatus.Rejected,
            TsWeekStatus.Draft => TsApprovalStatus.Rejected,
            _ => null
        };

        if (mappedAction == null) return true;

        var currentManagers = _unitOfWork.UserRepository.Where(u => u.UserProjects
            .Any(up => up.ProjectId == existingTsWeek.ProjectId && up.ProjectRole == RoleTypes.Manager)).ToList();

        if (existingTsWeek.Approval != null)
        {
            existingTsWeek.Approval.ActionTime = DateTime.UtcNow;
            existingTsWeek.Approval.Action = mappedAction.Value;

            if (newStatus == TsWeekStatus.Rejected || newStatus == TsWeekStatus.Approved)
            {
                existingTsWeek.Approval.Comment = dto.Comment;
            }

            existingTsWeek.Approval.Managers.Clear();
            foreach (var manager in currentManagers)
            {
                existingTsWeek.Approval.Managers.Add(manager);
            }
        }
        else
        {
            if (newStatus == TsWeekStatus.Submitted)
            {
                existingTsWeek.Approval = new TsApproval
                {
                    TsWeekId = existingTsWeek.Id,
                    ActionTime = DateTime.UtcNow,
                    Action = mappedAction.Value,
                    Comment = null,
                    Managers = currentManagers,
                    TsWeek = existingTsWeek,
                };
            }
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
