using Timesheet.Data.Dtos;
using Timesheet.Data.Interfaces;
using Timesheet.Data.Models;

namespace Timesheet.Data.Dtos;

public class UserRDto : UserDtoBase, IEntity
{
    public required int Id { get; set; }
    public required ICollection<UserProjectRDto> UserProjects { get; set; }
    public required RoleRDto Role { get; set; }
}
