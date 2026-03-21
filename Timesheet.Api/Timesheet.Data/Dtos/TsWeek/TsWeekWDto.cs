using System;

namespace Timesheet.Data.Dtos;

public class TsWeekWDto : TsWeekDtoBase
{
    public required int ProjectId { get; set; }
    public required int DaysInWeek { get; set; } = 7;
    public required DateTime StartDate { get; set; }
}
