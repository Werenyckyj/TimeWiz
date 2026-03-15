using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Models;

public class Company : Entity
{
    // Properties
    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }
    [Required]
    [MaxLength(20)]
    public required string CIN { get; set; }

    // Collections
    public required ICollection<User> Employees { get; set; }
}
