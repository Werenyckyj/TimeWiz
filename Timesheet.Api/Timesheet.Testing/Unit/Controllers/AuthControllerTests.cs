using System;
using System.Text;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Timesheet.Core.Services.Auth;
using Timesheet.Core.Services.Mail;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Data.Models;
using Timesheet.Web.Controllers.Auth;

namespace Timesheet.Testing.Unit.Controllers;

public class AuthControllerTests : TestBase
{
    private readonly AuthController _controller;
    public AuthControllerTests()
    {
        var authServiceMock = new Mock<IAuthService>();
        authServiceMock.Setup(s => s.Register(It.Is<RegisterWDto>(dto => dto.Username == "newuser" && dto.Password == "Password123!" && dto.Name == "John" && dto.Surname == "Doe" && dto.Email == "john.doe@example.com" && dto.RoleId == 1 && dto.CompanyId == 1))).Returns("true");
        var logInRDto = new LogInRDto { Username = "existinguser", Token = new TokenDto { AccessToken = "fake-jwt-token", RefreshToken = "fake-refresh-token", ExpirationTime = DateTime.UtcNow.AddHours(1), UserId = 1 } };
        authServiceMock.Setup(s => s.Authenticate(It.Is<LogInWDto>(dto => dto.Username == "existinguser" && dto.Password == "Password123!"))).Returns(logInRDto);
        var tokenDto = new TokenDto
        {
            AccessToken = "fake-jwt-token",
            RefreshToken = "fake-refresh-token",
            ExpirationTime = DateTime.UtcNow.AddHours(1),
            UserId = 1
        };
        authServiceMock
            .Setup(s => s.RefreshToken("fake-jwt-token", "fake-refresh-token"))
            .Returns(tokenDto);
        authServiceMock
            .Setup(s => s.RevokeToken("fake-jwt-token", "fake-refresh-token"))
            .Returns(true);
        var resetToken = new PasswordResetToken
        {
            UserId = 1,
            Token = Encoding.UTF8.GetBytes("fake-reset-token"),
            Expiration = DateTime.UtcNow.AddHours(1),
            IsUsed = false,
            User = new User
            {
                Id = 1,
                Username = "john.doe",
                Email = "john.doe@example.com",
                Name = "John",
                Surname = "Doe",
                PasswordHash = "fake-hash",
                Role = new Role { Id = 1, Name = "User", Privilege = Data.Enums.RoleTypes.Employee, Users = [] },
                Company = new Company { Id = 1, Name = "Test Company", CIN = "12345678", Employees = [] },
                TsWeeks = new List<TsWeek>(),
                UserProjects = new List<UserProject>(),
                PasswordResetTokens = new List<PasswordResetToken>(),
                TokenInfos = new List<TokenInfo>()
            }
        };
        authServiceMock
            .Setup(s => s.ForgotPassword("john.doe@example.com"))
            .Returns(resetToken);
        authServiceMock
            .Setup(s => s.ResetPassword(It.Is<ResetPasswordDto>(dto => dto.Email == "john.doe@example.com" && dto.NewPassword == "NewPassword123!" && dto.Token == "fake-reset-token"), out It.Ref<string>.IsAny))
            .Returns(true);

        _controller = new AuthController(authServiceMock.Object, new Mock<IMapper>().Object, _unitOfWork, new Mock<IMailService>().Object);
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Scheme = "https";

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public void Register_ReturnsOkResult_WhenRegistrationIsSuccessful()
    {
        // Arrange
        var registerDto = new RegisterWDto { Username = "newuser", Password = "Password123!", Name = "John", Surname = "Doe", Email = "john.doe@example.com", RoleId = 1, CompanyId = 1 };

        // Act
        var result = _controller.Register(registerDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.True(okResult.Value is true);
    }

    [Fact]
    public void LogIn_ReturnsOkResult_WhenAuthenticationIsSuccessful()
    {
        // Arrange
        var logInDto = new LogInWDto { Username = "existinguser", Password = "Password123!" };

        // Act
        var result = _controller.LogIn(logInDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<LogInRDto>(okResult.Value);
        Assert.Equal("fake-jwt-token", returnValue.Token!.AccessToken);
        Assert.Equal("fake-refresh-token", returnValue.Token!.RefreshToken);
    }

    [Fact]
    public void LogIn_ReturnsUnauthorizedResult_WhenAuthenticationFails()
    {
        // Arrange
        var logInDto = new LogInWDto { Username = "nonexistentuser", Password = "WrongPassword!" };

        // Act
        var result = _controller.LogIn(logInDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public void Refresh_ReturnsOkResult_WhenRefreshIsSuccessful()
    {
        // Arrange
        var refreshDto = new RefreshTokenWDto { AccessToken = "fake-jwt-token", RefreshToken = "fake-refresh-token" };

        // Act
        var result = _controller.Refresh(refreshDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<TokenDto>(okResult.Value);
        Assert.Equal("fake-jwt-token", returnValue.AccessToken);
        Assert.Equal("fake-refresh-token", returnValue.RefreshToken);
    }

    [Fact]
    public void Refresh_ReturnsBadRequestResult_WhenRefreshFails()
    {
        // Arrange
        var refreshDto = new RefreshTokenWDto { AccessToken = "invalid-token", RefreshToken = "invalid-refresh-token" };

        // Act
        var result = _controller.Refresh(refreshDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public void Revoke_ReturnsOkResult_WhenRevocationIsSuccessful()
    {
        // Arrange
        var revokeDto = new RefreshTokenWDto { AccessToken = "fake-jwt-token", RefreshToken = "fake-refresh-token" };

        // Act
        var result = _controller.Revoke(revokeDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Token revoked successfully.", okResult.Value);
    }

    [Fact]
    public async Task ForgotPassword_ReturnsOkResult_WhenEmailExists()
    {
        // Arrange
        var forgotPasswordDto = new ForgotPasswordDto { Email = "john.doe@example.com" };

        // Act
        var result = await _controller.ForgotPassword(forgotPasswordDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Password reset link has been sent.", okResult.Value);
    }

    [Fact]
    public async Task ForgotPassword_ReturnsOkResult_WhenEmailDoesNotExist()
    {
        // Arrange
        var forgotPasswordDto = new ForgotPasswordDto { Email = "nonexistentuser@example.com" };

        // Act
        var result = await _controller.ForgotPassword(forgotPasswordDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Password reset link has been sent.", okResult.Value);
    }

    [Fact]
    public void ResetPassword_ReturnsOkResult_WhenResetIsSuccessful()
    {
        // Arrange
        var resetDto = new ResetPasswordDto { Email = "john.doe@example.com", NewPassword = "NewPassword123!", Token = "fake-reset-token" };

        // Act
        var result = _controller.ResetPassword(resetDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Password has been reset successfully.", okResult.Value);
    }

    [Fact]
    public void ResetPassword_ReturnsBadRequestResult_WhenResetFails()
    {
        // Arrange
        var resetDto = new ResetPasswordDto { Email = "john.doe@example.com", NewPassword = "NewPassword123!", Token = "bad-reset-token" };

        // Act
        var result = _controller.ResetPassword(resetDto);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
    }
}
