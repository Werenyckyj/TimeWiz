using System;

namespace Timesheet.Data.Dtos;

public class UserWDto : UserDtoBase
{
    public required int RoleId { get; set; }
    public required int CompanyId { get; set; }
}
