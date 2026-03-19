using System;
using Timesheet.Data.Dtos.Auth;

namespace Timesheet.Core.Services.Auth;

public interface IAuthService
{
    /// <summary>
    /// Authenticates a user based on the provided credentials.
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    LogInWDto Authenticate(LogInRDto dto);

    /// <summary>
    /// Refreshes the access token using the provided refresh token.
    /// </summary>
    /// <param name="refreshToken"></param>
    /// <returns></returns>
    TokenDto RefreshToken(string refreshToken);

    /// <summary>
    /// Revokes the provided refresh token, effectively logging the user out.
    /// </summary>
    /// <param name="refreshToken"></param>
    /// <returns></returns>
    RevokeTokenDto RevokeToken(string refreshToken);
}
