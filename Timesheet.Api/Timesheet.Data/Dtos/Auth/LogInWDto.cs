using System;

namespace Timesheet.Data.Dtos.Auth;

public class LogInWDto : LogInDtoBase
{
    public TokenDto? Token { get; set; }
    public bool IsAthorized { get; set; }
    public required string Login { get; set; }
}
