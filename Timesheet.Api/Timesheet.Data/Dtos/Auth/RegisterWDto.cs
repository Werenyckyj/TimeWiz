using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Interfaces;

namespace Timesheet.Data.Dtos.Auth;

public class RegisterWDto : RegisterDtoBase
{
    [Required(ErrorMessage = "Password is required.")]
    public required string Password { get; set; }
    [Required(ErrorMessage = "Role is required.")]
    public required int RoleId { get; set; }
    [Required(ErrorMessage = "Company is required.")]
    public required int CompanyId { get; set; }
}
