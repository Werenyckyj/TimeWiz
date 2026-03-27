using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Dtos;

public class CompanyDtoBase
{
    [Required(ErrorMessage = "Name is required.")]
    public required string Name { get; set; }
    [Required(ErrorMessage = "CIN is required.")]
    public required string CIN { get; set; }
}
