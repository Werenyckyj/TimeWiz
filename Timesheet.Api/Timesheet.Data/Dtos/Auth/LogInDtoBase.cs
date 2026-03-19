using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Dtos.Auth;

public class LogInDto
{
    [Required(ErrorMessage = "Username is required.")]
    public required string Username { get; set; }
    [Password]
    public required string Password { get; set; }
}
