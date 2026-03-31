using System;

namespace Timesheet.Data.Dtos;

public class UserWDto : UserDtoBase
{
    public required RoleWDto Role { get; set; }

}
