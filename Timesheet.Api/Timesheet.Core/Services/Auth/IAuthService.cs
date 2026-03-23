using System;
using Timesheet.Data.Dtos.Auth;

namespace Timesheet.Core.Services.Auth;

public interface IAuthService
{
    /// <summary>
    /// Registers a new user based on the provided registration details.
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    string Register(RegisterWDto dto);

    /// <summary>
    /// Authenticates a user based on the provided credentials.
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    LogInRDto? Authenticate(LogInWDto dto);

    /// <summary>
    /// Refreshes the access token using the provided refresh token.
    /// </summary>
    /// <param name="refreshToken"></param>
    /// <returns></returns>
    TokenDto? RefreshToken(string accessToken, string refreshToken);

    /// <summary>
    /// Revokes the provided refresh token, effectively logging the user out.
    /// </summary>
    /// <param name="refreshToken"></param>
    /// <returns></returns>
    bool RevokeToken(string accessToken, string refreshToken);
}
