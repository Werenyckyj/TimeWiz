using System;
using Timesheet.Data.Interfaces;
using Timesheet.Data.Models;

namespace Timesheet.Data.Dtos.User;

public class UserRDto : UserDtoBase, IEntity
{
    public required int Id { get; set; }
    public required ICollection<TsWeek> TsWeeks { get; set; }
    public required ICollection<UserProject> UserProjects { get; set; }
}
