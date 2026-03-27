using System;
using Timesheet.Data.Enums;
using Timesheet.Data.Interfaces;

namespace Timesheet.Data.Dtos;

public class UserProjectRDto : IEntity
{
    public required int Id { get; set; }
    public required int UserId { get; set; }
    public required int ProjectId { get; set; }
    public required RoleTypes ProjectRole { get; set; }
}
