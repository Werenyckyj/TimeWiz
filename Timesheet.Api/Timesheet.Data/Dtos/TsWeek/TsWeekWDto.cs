using System;

namespace Timesheet.Data.Dtos;

public class TsWeekWDto : TsWeekDtoBase
{
    public required int ProjectId { get; set; }
    public int DaysInWeek { get; set; } = 7;
    public DateTime StartDate { get; set; }
    public ICollection<TsEntryWDto> TsEntries { get; set; } = [];

}
