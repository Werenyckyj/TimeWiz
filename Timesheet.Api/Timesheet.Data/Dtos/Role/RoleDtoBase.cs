using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Enums;

namespace Timesheet.Data.Dtos;

public class RoleDtoBase
{
    [Required(ErrorMessage = "Name is required.")]
    public required string Name { get; set; }
    [Required(ErrorMessage = "Privilege is required.")]
    public required RoleTypes Privilege { get; set; }
}
