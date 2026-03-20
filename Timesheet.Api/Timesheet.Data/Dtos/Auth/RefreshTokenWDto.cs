using System;

namespace Timesheet.Data.Dtos.Auth;

public class RefreshTokenWDto
{
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
}
