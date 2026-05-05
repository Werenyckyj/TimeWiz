using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Timesheet.Data.Models;

[Index(nameof(Username), IsUnique = true)]
[Index(nameof(Email), IsUnique = true)]
public class User : Entity
{
    // Properties
    [Required]
    [MaxLength(120)]
    public required string Username { get; set; }
    [Required]
    [MaxLength(80)]
    public required string Name { get; set; }
    [Required]
    [MaxLength(100)]
    public required string Surname { get; set; }
    [Required]
    [MaxLength(180)]
    public required string Email { get; set; }
    [Required]
    [MaxLength(128)]
    public required string PasswordHash { get; set; }
    public bool IsActive { get; set; } = true;

    // Foreign keys
    public int RoleId { get; set; }
    public required Role Role { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    // Collections
    public required ICollection<TsWeek> TsWeeks { get; set; }
    public required ICollection<UserProject> UserProjects { get; set; }
    public required ICollection<PasswordResetToken> PasswordResetTokens { get; set; }
    public required ICollection<TokenInfo> TokenInfos { get; set; }
    public ICollection<TsApproval> TsApprovals { get; set; } = [];
}
