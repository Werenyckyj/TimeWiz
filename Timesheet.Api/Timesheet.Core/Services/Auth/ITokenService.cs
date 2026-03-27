using System;
using System.Security.Claims;
using Timesheet.Data.Models;

namespace Timesheet.Core.Services.Auth;

public interface ITokenService
{
    /// <summary>
    /// Generates an access token for the specified user.
    /// </summary>
    /// <param name="user"></param>
    /// <returns></returns>
    string GenerateAccessToken(IEnumerable<Claim> claims);

    /// <summary>
    /// Generates a refresh token.
    /// </summary>
    /// <returns></returns>
    string GenerateRefreshToken();

    /// <summary>
    /// Extracts the user ID from the provided access token.
    /// </summary>
    /// <param name="accessToken"></param>
    /// <returns></returns>
    int GetUserIdFromAccessToken(string accessToken);

    /// <summary>
    /// Extracts the claims principal from an expired access token, allowing for token refresh operations.
    /// </summary>
    /// <param name="token"></param>
    /// <returns></returns>
    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
