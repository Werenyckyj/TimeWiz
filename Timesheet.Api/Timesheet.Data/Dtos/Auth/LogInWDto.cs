using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Dtos.Auth;

public class LogInWDto : LogInDtoBase
{
    [Required(ErrorMessage = "Password is required.")]
    public required string Password { get; set; }
}
