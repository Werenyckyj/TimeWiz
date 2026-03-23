using System;
using Timesheet.Data.Interfaces;

namespace Timesheet.Data.Dtos;

public class ProjectRDto : ProjectDtoBase, IEntity
{
    public required int Id { get; set; }
}
