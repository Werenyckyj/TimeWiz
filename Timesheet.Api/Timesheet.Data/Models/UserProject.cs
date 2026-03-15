using System;
using System.ComponentModel.DataAnnotations;
using Timesheet.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace Timesheet.Data.Models;

[Index(nameof(UserId), nameof(ProjectId), IsUnique = true)]
public class UserProject : Entity
{
    // Properties
    [Required]
    public required RoleTypes ProjectRole { get; set; } = RoleTypes.InternalEmployee;

    // Foreign keys
    public int UserId { get; set; }
    public required User User { get; set; }

    public int ProjectId { get; set; }
    public required Project Project { get; set; }
}
