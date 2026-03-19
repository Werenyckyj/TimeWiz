using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Dtos.Auth;

public class RegisterDtoBase
{
    [Required(ErrorMessage = "Name is required.")]
    public required string Name { get; set; }
    [Required(ErrorMessage = "Surname is required.")]
    public required string Surname { get; set; }
    [Required(ErrorMessage = "Email is required.")]
    public required string Email { get; set; }
    [Required(ErrorMessage = "Username is required.")]
    public required string Username { get; set; }
}
