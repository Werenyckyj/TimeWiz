using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Dtos;

public class ProjectDtoBase
{
    [Required(ErrorMessage = "Code is required.")]
    public required string Code { get; set; }
    [Required(ErrorMessage = "Name is required.")]
    public required string Name { get; set; }
    [Required(ErrorMessage = "IsActive is required.")]
    public required bool IsActive { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}
