using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Enums;

namespace Timesheet.Data.Models;

public class TsWeek : Entity
{
    // Properties
    [Required]
    public required int Year { get; set; }
    [Required]
    public required int WeekNumber { get; set; }
    [Required]
    public required TsWeekStatus Status { get; set; } = TsWeekStatus.Draft;
    public string Comment { get; set; } = string.Empty;

    // Foreign keys
    public int UserId { get; set; }
    public required User User { get; set; }

    public int ProjectId { get; set; }
    public required Project Project { get; set; }
    public required TsApproval Approval { get; set; }

    // Collections
    public required ICollection<TsEntry> TsEntries { get; set; }
}
