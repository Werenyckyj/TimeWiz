using System;
using Timesheet.Data.Dtos;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Data.Models;

namespace Timesheet.Core.Services.Auth;

public interface IAuthService
{
    /// <summary>
    /// Registers a new user based on the provided registration details.
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    UserRDto? Register(RegisterWDto dto, out string message);

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

    /// <summary>
    /// Initiates the password reset process for the user with the specified email address.
    /// </summary>
    /// <param name="email"></param>
    /// <returns></returns>
    PasswordResetToken ForgotPassword(string email);

    /// <summary>
    /// Resets the user's password using the provided reset token and new password.
    /// </summary>
    /// <param name="dto"></param>
    /// <param name="message"></param>
    /// <returns></returns>
    bool ResetPassword(ResetPasswordDto dto, out string message);
}
