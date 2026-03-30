using System;
using System.Text;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Timesheet.Core;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Core.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Timesheet.Data.Models;
using Timesheet.Core.Services.Mail;
using System.Threading.Tasks;
using Timesheet.Data.Dtos;

namespace Timesheet.Web.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController(IAuthService authService, IMapper mapper, UnitOfWork unitOfWork, IMailService mailService) : ControllerBase
{
    private readonly IAuthService _authService = authService;
    private readonly IMapper _mapper = mapper;
    private readonly UnitOfWork _unitOfWork = unitOfWork;
    private readonly IMailService _mailService = mailService;

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(UserRDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult Register([FromBody] RegisterWDto dto)
    {
        var result = _authService.Register(dto);
        return result == null ? BadRequest("Failed to create user.") : Ok(result);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LogInRDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult LogIn([FromBody] LogInWDto dto)
    {
        var result = _authService.Authenticate(dto);
        return result != null ? Ok(result) : BadRequest("Invalid username or password.");
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(TokenDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult Refresh([FromBody] RefreshTokenWDto dto)
    {
        var result = _authService.RefreshToken(dto.AccessToken, dto.RefreshToken);
        return result != null ? Ok(result) : BadRequest("Invalid refresh token.");
    }

    [HttpPost("revoke")]
    [Authorize(Roles = "Admin, Manager, Employee, External")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult Revoke([FromBody] RefreshTokenWDto dto)
    {
        var result = _authService.RevokeToken(dto.AccessToken, dto.RefreshToken);
        return result ? Ok("Token revoked successfully.") : BadRequest("Failed to revoke token.");
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var result = _authService.ForgotPassword(dto.Email);
        if (result == null)
            return Ok("Password reset link has been sent."); // Avoid revealing user existence

        var resetLink = $"{Request.Scheme}://{Environment.GetEnvironmentVariable("FRONTEND_URL")}/reset-password?token={Encoding.UTF8.GetString(result.Token)}&email={result.User.Email}";

        var subject = "Password Reset Request";
        var body = $"Dear {result.User.Name},\n\n" +
                    $"You requested a password reset. Please click the link below to reset your password:\n{resetLink}\n\n" +
                    $"This link will expire in {result.Expiration.Subtract(DateTime.UtcNow).TotalMinutes} minutes.\n" +
                    $"If you did not request this, please ignore this email.\n\n" +
                    $"Best regards,\nTimesheet Team";
        await _mailService.SendAsync(result.User.Email, subject, body);

        return Ok("Password reset link has been sent.");
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public IActionResult ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var result = _authService.ResetPassword(dto, out string message);
        return result ? Ok("Password has been reset successfully.") : BadRequest(message);
    }
}
