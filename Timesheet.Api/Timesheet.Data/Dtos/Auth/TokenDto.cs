using System;
using Timesheet.Data.Dtos.User;

namespace Timesheet.Data.Dtos.Auth;

public class TokenDto
{
    public required string AccessToken { get; set; }
    public required long ExpirationTime { get; set; }
    public string? RefreshToken { get; set; }

    public required UserRDto User { get; set; }
}
