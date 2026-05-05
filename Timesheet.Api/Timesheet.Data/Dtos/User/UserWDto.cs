using System;

namespace Timesheet.Data.Dtos;

public class UserWDto : UserDtoBase
{
    public required int RoleId { get; set; }
    public int CompanyId { get; set; }
}
