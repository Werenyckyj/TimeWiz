using System;
using System.ComponentModel.DataAnnotations;

namespace Timesheet.Data.Models;

public class TokenInfo : Entity
{
    // Properties
    [Required]
    [MaxLength(200)]
    public required string RefreshToken { get; set; }
    [Required]
    public required DateTime Expiration { get; set; }

    // Foreign keys
    public int UserId { get; set; }
    public required User User { get; set; }
}
