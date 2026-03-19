using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Dtos.Auth;

public class LogInDtoBase
{
    [Required(ErrorMessage = "Username is required.")]
    public required string Username { get; set; }
    [Required(ErrorMessage = "Password is required.")]
    public required string Password { get; set; }
}