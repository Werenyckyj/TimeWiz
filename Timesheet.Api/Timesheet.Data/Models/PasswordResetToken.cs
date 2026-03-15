using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Models;

public class PasswordResetToken : Entity
{
    // Properties
    [Required]
    [MaxLength(128)]
    public required byte[] Token { get; set; }
    [Required]
    public required DateTime Expiration { get; set; }
    [Required]
    public required bool IsUsed { get; set; }

    // Foreign keys
    public int UserId { get; set; }
    public required User User { get; set; }
}
