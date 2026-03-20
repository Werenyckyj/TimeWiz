
namespace Timesheet.Data.Dtos.Auth;

public class TokenDto
{
    public required string AccessToken { get; set; }
    public required DateTime ExpirationTime { get; set; }
    public string? RefreshToken { get; set; }
    public int UserId { get; set; }
}
