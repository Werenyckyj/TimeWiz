using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Enums;

namespace Timesheet.Data.Models;

public class Role : Entity
{
    // Properties
    [Required]
    public required string Name { get; set; }
    [Required]
    public required RoleTypes Privilege { get; set; }

    // Collections
    public required ICollection<User> Users { get; set; } = new List<User>();
}
