using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Dtos.Auth;

public class ResetPasswordDto
{
    [EmailAddress, Required]
    public required string Email { get; set; }
    [Required]
    public required string Token { get; set; }
    [Required, MinLength(8)]
    public required string NewPassword { get; set; }
}
