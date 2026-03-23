using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Enums;

namespace Timesheet.Data.Models;

public class TsApproval : Entity
{
    // Properties
    [Required]
    public required TsApprovalStatus Action { get; set; } = TsApprovalStatus.Pending;
    [Required]
    public required DateTime ActionTime { get; set; }

    [MaxLength(1024)]
    public string? Comment { get; set; }

    // Foreign keys
    public int TsWeekId { get; set; }
    public required TsWeek TsWeek { get; set; }

    public int UserId { get; set; }
    public required User User { get; set; }

    // Collections
    public required IEnumerable<User> Managers { get; set; }
}
