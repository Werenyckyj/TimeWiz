using Timesheet.Data.Dtos;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Core.Services.Timesheet;

public interface ITimesheetService
{
    /// <summary>
    /// Manages the approval process for a timesheet week based on its submission status and any changes in its approval status.
    /// </summary>
    /// <param name="oldStatus"></param>
    /// <param name="newStatus"></param>
    /// <param name="existingTsWeek"></param>
    /// <param name="dto"></param>
    /// <returns></returns>
    public bool ManageApproval(TsWeekStatus oldStatus, TsWeekStatus newStatus, TsWeek existingTsWeek, TsWeekWDto dto);

    /// <summary>
    /// Sends an email notification to the manager when a timesheet week is newly submitted for approval.
    /// </summary>
    /// <param name="existingTsWeek"></param>
    /// <returns></returns>
    public Task SendMailToManager(TsWeek existingTsWeek);

    /// <summary>
    /// Sends an email notification to the employee when their timesheet week has been rejected by the manager.
    /// </summary>
    /// <param name="existingTsWeek"></param>
    /// <returns></returns>
    public Task SendMailToEmployee(TsWeek existingTsWeek);
}