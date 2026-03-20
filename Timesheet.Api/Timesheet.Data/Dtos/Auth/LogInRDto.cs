using System;
using Timesheet.Data.Interfaces;

namespace Timesheet.Data.Dtos.Auth;

public class LogInRDto : LogInDtoBase
{
    public TokenDto? Token { get; set; }
    public bool IsAuthorized { get; set; }
}
