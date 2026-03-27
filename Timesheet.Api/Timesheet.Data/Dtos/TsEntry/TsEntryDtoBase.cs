namespace Timesheet.Data.Dtos;

public class TsEntryDtoBase
{
    public required DateTime WorkDate { get; set; }
    public required double Hours { get; set; }
    public string? Notes { get; set; }
}
