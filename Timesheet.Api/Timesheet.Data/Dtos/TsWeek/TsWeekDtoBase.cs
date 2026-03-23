using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Data.Dtos;

public class TsWeekDtoBase
{
    [Required]
    public required int Year { get; set; }
    [Required]
    public required int WeekNumber { get; set; }
    [Required]
    public required int UserId { get; set; }

    public ICollection<TsEntry> TsEntries { get; set; } = [];
    public string Comment { get; set; } = string.Empty;
    [Required]
    public required TsWeekStatus Status { get; set; }
}
