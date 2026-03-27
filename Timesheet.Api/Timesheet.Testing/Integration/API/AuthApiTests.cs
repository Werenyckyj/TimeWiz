using System;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Timesheet.Data;
using Timesheet.Data.Dtos;
using Timesheet.Data.Dtos.Auth;

namespace Timesheet.Testing.Integration.API;

public class AuthApiTests : ApiTestsBase
{
    private CompanyRDto? _testCompany;
    private RoleRDto? _testRole;
    public AuthApiTests(WebApplicationFactory<Program> factory) : base(factory)
    {
        InitializeAsync().GetAwaiter().GetResult();
    }
    private async Task InitializeAsync()
    {
        var companyReq = new CompanyWDto
        {
            Name = "Test Company",
            CIN = "12345678",
        };

        var roleReq = new RoleWDto
        {
            Name = "Test Role",
            Privilege = Data.Enums.RoleTypes.Employee
        };

        var companyResponse = await _client.PostAsJsonAsync("api/company", companyReq);
        _testCompany = await companyResponse.Content.ReadFromJsonAsync<CompanyRDto>();

        var roleResponse = await _client.PostAsJsonAsync("api/role", roleReq);
        _testRole = await roleResponse.Content.ReadFromJsonAsync<RoleRDto>();
    }

    [Fact]
    public async Task Register_ReturnsOk()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };

        // Act
        var registerResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);

        // Assert
        registerResponse.EnsureSuccessStatusCode();
        var result = await registerResponse.Content.ReadFromJsonAsync<UserRDto>();
        Assert.NotNull(result);
        Assert.Equal(registerUser.Email, result!.Email);
    }

    [Fact]
    public async Task Register_ReturnsBadRequest()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var registerResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, registerResponse.StatusCode);
    }

    [Fact]
    public async Task LogIn_ReturnsOk()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var logInResponse = await _client.PostAsJsonAsync("api/auth/login", new LogInWDto
        {
            Username = registerUser.Username,
            Password = registerUser.Password
        });

        // Assert
        logInResponse.EnsureSuccessStatusCode();
        var result = await logInResponse.Content.ReadFromJsonAsync<LogInRDto>();
        Assert.NotNull(result);
        Assert.Equal(registerUser.Username, result!.Username);
    }

    [Fact]
    public async Task LogIn_ReturnsBadRequest()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var logInResponse = await _client.PostAsJsonAsync("api/auth/login", new LogInWDto
        {
            Username = registerUser.Username,
            Password = "WrongPassword"
        });

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, logInResponse.StatusCode);
    }

    [Fact]
    public async Task RefreshToken_ReturnsOk()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();
        var logInResponse = await _client.PostAsJsonAsync("api/auth/login", new LogInWDto
        {
            Username = registerUser.Username,
            Password = registerUser.Password
        });
        logInResponse.EnsureSuccessStatusCode();
        var logInResult = await logInResponse.Content.ReadFromJsonAsync<LogInRDto>();
        Assert.NotNull(logInResult!.Token!.RefreshToken);

        // Act
        var refreshResponse = await _client.PostAsJsonAsync("api/auth/refresh", new RefreshTokenWDto
        {
            AccessToken = logInResult.Token.AccessToken,
            RefreshToken = logInResult.Token.RefreshToken
        });

        // Assert
        refreshResponse.EnsureSuccessStatusCode();
        var refreshResult = await refreshResponse.Content.ReadFromJsonAsync<TokenDto>();
        Assert.NotNull(refreshResult);
        Assert.NotEqual(logInResult.Token.AccessToken, refreshResult!.AccessToken);
    }

    [Fact]
    public async Task RefreshToken_ReturnsBadRequest()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();
        var logInResponse = await _client.PostAsJsonAsync("api/auth/login", new LogInWDto
        {
            Username = registerUser.Username,
            Password = registerUser.Password
        });
        logInResponse.EnsureSuccessStatusCode();
        var logInResult = await logInResponse.Content.ReadFromJsonAsync<LogInRDto>();
        Assert.NotNull(logInResult!.Token!.RefreshToken);

        // Act
        var refreshResponse = await _client.PostAsJsonAsync("api/auth/refresh", new RefreshTokenWDto
        {
            AccessToken = logInResult.Token.AccessToken,
            RefreshToken = "InvalidRefreshToken"
        });

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, refreshResponse.StatusCode);
    }

    [Fact]
    public async Task RevokeToken_ReturnsOk()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();
        var logInResponse = await _client.PostAsJsonAsync("api/auth/login", new LogInWDto
        {
            Username = registerUser.Username,
            Password = registerUser.Password
        });
        logInResponse.EnsureSuccessStatusCode();
        var logInResult = await logInResponse.Content.ReadFromJsonAsync<LogInRDto>();
        Assert.NotNull(logInResult!.Token!.RefreshToken);

        // Act
        var revokeResponse = await _client.PostAsJsonAsync("api/auth/revoke", new RefreshTokenWDto
        {
            AccessToken = logInResult.Token.AccessToken,
            RefreshToken = logInResult.Token.RefreshToken
        });

        // Assert
        revokeResponse.EnsureSuccessStatusCode();
        var revokeResult = await revokeResponse.Content.ReadFromJsonAsync<string>();
        Assert.Equal("Token revoked successfully.", revokeResult);

        // Verify the token is revoked
        var refreshResponse = await _client.PostAsJsonAsync("api/auth/refresh", new RefreshTokenWDto
        {
            AccessToken = logInResult.Token.AccessToken,
            RefreshToken = logInResult.Token.RefreshToken
        });
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, refreshResponse.StatusCode);
    }

    [Fact]
    public async Task RevokeToken_ReturnsBadRequest()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();
        var logInResponse = await _client.PostAsJsonAsync("api/auth/login", new LogInWDto
        {
            Username = registerUser.Username,
            Password = registerUser.Password
        });
        logInResponse.EnsureSuccessStatusCode();
        var logInResult = await logInResponse.Content.ReadFromJsonAsync<LogInRDto>();
        Assert.NotNull(logInResult!.Token!.RefreshToken);

        // Act
        var revokeResponse = await _client.PostAsJsonAsync("api/auth/revoke", new RefreshTokenWDto
        {
            AccessToken = logInResult.Token.AccessToken,
            RefreshToken = "InvalidRefreshToken"
        });

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, revokeResponse.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_ReturnsOk()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var forgotPasswordResponse = await _client.PostAsJsonAsync("api/auth/forgot-password", new ForgotPasswordDto
        {
            Email = registerUser.Email
        });

        // Assert
        forgotPasswordResponse.EnsureSuccessStatusCode();
        var forgotPasswordResult = await forgotPasswordResponse.Content.ReadFromJsonAsync<string>();
        Assert.Equal("Password reset link has been sent.", forgotPasswordResult);
    }

    [Fact]
    public async Task ForgotPassword_ReturnsOk_ForNonExistentEmail()
    {
        // Act
        var forgotPasswordResponse = await _client.PostAsJsonAsync("api/auth/forgot-password", new ForgotPasswordDto
        {
            Email = "nonexistent@example.com"
        });

        // Assert
        forgotPasswordResponse.EnsureSuccessStatusCode();
        var forgotPasswordResult = await forgotPasswordResponse.Content.ReadFromJsonAsync<string>();
        Assert.Equal("Password reset link has been sent.", forgotPasswordResult);
    }

    [Fact]
    public async Task ResetPassword_ReturnsOk()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();
        var forgotPasswordResponse = await _client.PostAsJsonAsync("api/auth/forgot-password", new ForgotPasswordDto
        {
            Email = registerUser.Email
        });
        forgotPasswordResponse.EnsureSuccessStatusCode();
        var forgotPasswordResult = await forgotPasswordResponse.Content.ReadFromJsonAsync<string>();
        Assert.Equal("Password reset link has been sent.", forgotPasswordResult);

        // Act
        // Note: We need to capture the reset token from the email or the database. 
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var dbUser = db.Users.FirstOrDefault(u => u.Email == registerUser.Email);
        Assert.NotNull(dbUser);
        var tokenEntity = db.PasswordResetTokens.FirstOrDefault(t => t.UserId == dbUser.Id);
        Assert.NotNull(tokenEntity);
        var resetToken = System.Text.Encoding.UTF8.GetString(tokenEntity.Token);

        var resetPasswordResponse = await _client.PostAsJsonAsync("api/auth/reset-password", new ResetPasswordDto
        {
            Email = registerUser.Email,
            Token = resetToken,
            NewPassword = "NewTest@1234"
        });

        // Assert
        resetPasswordResponse.EnsureSuccessStatusCode();
        var resetPasswordResult = await resetPasswordResponse.Content.ReadFromJsonAsync<string>();
        Assert.Equal("Password has been reset successfully.", resetPasswordResult);

        // Verify the user can log in with the new password
        var logInResponse = await _client.PostAsJsonAsync("api/auth/login", new LogInWDto
        {
            Username = registerUser.Username,
            Password = "NewTest@1234"
        });
        logInResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ResetPassword_ReturnsBadRequest_ForInvalidToken()
    {
        // Arrange
        var registerUser = new RegisterWDto
        {
            Name = "Test",
            Surname = "User",
            Email = "testuser@example.com",
            Username = "Test@1234",
            Password = "Test@1234",
            CompanyId = _testCompany?.Id ?? 0,
            RoleId = _testRole?.Id ?? 0
        };
        var createResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var resetPasswordResponse = await _client.PostAsJsonAsync("api/auth/reset-password", new ResetPasswordDto
        {
            Email = registerUser.Email,
            Token = "InvalidToken",
            NewPassword = "NewTest@1234"
        });

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, resetPasswordResponse.StatusCode);
    }
}