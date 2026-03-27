using Timesheet.Data.Interfaces;
using Timesheet.Data.Models;

namespace Timesheet.Data.Dtos;

public class TsWeekRDto : TsWeekDtoBase, IEntity
{
    public required int Id { get; set; }
    public required ProjectRDto Project { get; set; }
    public ICollection<TsEntryRDto> TsEntries { get; set; } = [];

}
