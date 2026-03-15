using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Models;

public class Project : Entity
{
    // Properties
    [Required]
    [MaxLength(40)]
    public required string Code { get; set; }
    [Required]
    [MaxLength(180)]
    public required string Name { get; set; }
    [Required]
    public required bool IsActive { get; set; }

    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }

    // Collections
    public required ICollection<TsWeek> TsWeeks { get; set; }
    public required ICollection<UserProject> UserProjects { get; set; }
}
