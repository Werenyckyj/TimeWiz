using System;

namespace Timesheet.Data.Dtos;

public class TsWeekWDto : TsWeekDtoBase
{
    public required int ProjectId { get; set; }
}
