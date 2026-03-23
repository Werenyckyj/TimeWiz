using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Dtos.Auth;

public class ForgotPasswordDto
{
    [EmailAddress, Required]
    public required string Email { get; set; }
}
