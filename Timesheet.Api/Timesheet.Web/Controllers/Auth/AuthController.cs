using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Timesheet.Core;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Core.Services.Auth;
using Microsoft.AspNetCore.Authorization;

namespace Timesheet.Web.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController(IAuthService authService, IMapper mapper, UnitOfWork unitOfWork) : ControllerBase
{
    private readonly IAuthService _authService = authService;
    private readonly IMapper _mapper = mapper;
    private readonly UnitOfWork _unitOfWork = unitOfWork;

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult Register([FromBody] RegisterWDto dto)
    {
        var result = _authService.Register(dto);
        return result == "true" ? Ok(true) : BadRequest(result);
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
    [Authorize(Roles = "Admin, Manager, Employee, External")]
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
}
