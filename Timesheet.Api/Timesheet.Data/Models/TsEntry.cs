using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Models;

public class TsEntry : Entity
{
    // Properties
    [Required]
    public required DateTime WorkDate { get; set; }
    [Required]
    public required double Hours { get; set; }

    [MaxLength(1024)]
    public string? Notes { get; set; }

    // Foreign keys
    public int TsWeekId { get; set; }
    public required TsWeek TsWeek { get; set; }
}
