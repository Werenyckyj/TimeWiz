using System;
using Timesheet.Data.Interfaces;

namespace Timesheet.Data.Dtos;

public class TsEntryRDto : TsEntryDtoBase, IEntity
{
    public required int Id { get; set; }
    public required int TsWeekId { get; set; }
}
