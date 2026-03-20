using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Models;

namespace Timesheet.Data.Dtos;

public class TsWeekDtoBase
{
    [Required]
    public required int Year { get; set; }
    [Required]
    public required int WeekNumber { get; set; }
    public ICollection<TsEntry> TsEntries { get; set; } = [];
}
