using System.Security.Claims;
using System.Text;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Moq;
using Timesheet.Core.Services.Auth;
using Timesheet.Data.Dtos;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Data.Models;

namespace Timesheet.Testing.Unit.Services;

public class AuthServiceTests : TestBase
{
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        var loggerMock = new Mock<ILogger<AuthService>>();

        var tokenServiceMock = new Mock<ITokenService>();
        tokenServiceMock
            .Setup(x => x.GenerateRefreshToken())
            .Returns("refresh-token-for-tests");
        tokenServiceMock
            .Setup(x => x.GenerateAccessToken(It.IsAny<IEnumerable<Claim>>()))
            .Returns("access-token-for-tests");
        tokenServiceMock
            .Setup(x => x.GetPrincipalFromExpiredToken(It.IsAny<string>()))
            .Returns((string token) =>
            {
                if (token == "access-token-for-tests")
                {
                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.Name, "testuser"),
                        new Claim(ClaimTypes.Role, "TestRole")
                    };
                    var identity = new ClaimsIdentity(claims, "TestAuthType");
                    return new ClaimsPrincipal(identity);
                }
                return null;
            });
        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<User, UserRDto>();
            cfg.CreateMap<Role, RoleRDto>();
            cfg.CreateMap<Company, CompanyRDto>();
            cfg.CreateMap<Company, CompanySimpleRDto>();

        });
        var realMapper = mapperConfig.CreateMapper();

        _authService = new AuthService(_unitOfWork, realMapper, loggerMock.Object, tokenServiceMock.Object);
    }

    [Fact]
    public void Register_Returns_Success()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();

        // Act
        var result = _authService.Register(registerDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
    }

    [Fact]
    public void Register_Returns_Failure_For_Duplicate_Username()
    {
        // Arrange
        var registerDto1 = new RegisterWDto
        {
            Username = "testuser",
            Email = "test1@example.com",
            Name = "Test",
            Surname = "User1",
            Password = "password123",
            RoleId = 1,
            CompanyId = 1
        };

        var registerDto2 = new RegisterWDto
        {
            Username = "testuser",
            Email = "test2@example.com",
            Name = "Test",
            Surname = "User2",
            Password = "password123",
            RoleId = 1,
            CompanyId = 1
        };

        // Act
        var result1 = _authService.Register(registerDto1);
        var result2 = _authService.Register(registerDto2);

        // Assert
        Assert.NotNull(result1);
        Assert.Equal(1, result1.Id);
        Assert.Null(result2);
    }

    [Fact]
    public void Register_Returns_Failure_For_Non_Existent_Role()
    {
        // Arrange
        var testUser = new RegisterWDto
        {
            Username = "testuser1",
            Email = "test@example.com",
            Name = "Test",
            Surname = "User1",
            Password = "password123",
            RoleId = 67,
            CompanyId = 1
        };

        // Act
        var result1 = _authService.Register(testUser);

        // Assert
        Assert.Null(result1);
    }

    [Fact]
    public void Register_Returns_Failure_For_Non_Existent_Company()
    {
        // Arrange
        var testUser = new RegisterWDto
        {
            Username = "testuser1",
            Email = "test1@example.com",
            Name = "Test",
            Surname = "User1",
            Password = "password123",
            RoleId = 4,
            CompanyId = 999
        };

        // Act
        var result1 = _authService.Register(testUser);

        // Assert
        Assert.Null(result1);
    }

    [Fact]
    public void Authenticate_Returns_Success()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();
        _authService.Register(registerDto);

        // Act
        var authResult = _authService.Authenticate(new LogInWDto { Username = registerDto.Username, Password = registerDto.Password });

        // Assert
        Assert.NotNull(authResult);
        Assert.True(authResult.IsAuthorized);
        Assert.NotNull(authResult.Token);
        Assert.NotEmpty(authResult.Token.AccessToken);
        Assert.Equal(registerDto.Username, authResult.Username);
        Assert.Equal(1, authResult.Token.UserId);
    }

    [Fact]
    public void Authenticate_Returns_Failure_For_Invalid_Username()
    {
        // Act
        var authResult = _authService.Authenticate(new LogInWDto { Username = "nonexistentuser", Password = "password123" });

        // Assert
        Assert.Null(authResult);
    }

    [Fact]
    public void Authenticate_Returns_Failure_For_Invalid_Password()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();
        _authService.Register(registerDto);

        // Act
        var authResult = _authService.Authenticate(new LogInWDto { Username = registerDto.Username, Password = "wrongpassword" });

        // Assert
        Assert.Null(authResult);
    }

    [Fact]
    public void Authenticate_Returns_Failure_For_Inactive_User()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();
        _authService.Register(registerDto);
        var user = _unitOfWork.UserRepository.GetByUsername(registerDto.Username);
        user!.IsActive = false;
        _unitOfWork.UserRepository.Update(user);
        _unitOfWork.SaveChanges();

        // Act
        var authResult = _authService.Authenticate(new LogInWDto { Username = registerDto.Username, Password = registerDto.Password });

        // Assert
        Assert.Null(authResult);
    }

    [Fact]
    public void RefreshToken_Returns_Success()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();
        _authService.Register(registerDto);
        var authResult = _authService.Authenticate(new LogInWDto { Username = registerDto.Username, Password = registerDto.Password });

        // Act
        var refreshResult = _authService.RefreshToken(authResult!.Token!.AccessToken, authResult.Token!.RefreshToken!);

        // Assert
        Assert.NotNull(refreshResult);
        Assert.NotEmpty(refreshResult.AccessToken);
        Assert.Equal(1, refreshResult.UserId);
    }

    [Fact]
    public void RefreshToken_Returns_Failure_For_Invalid_Tokens()
    {
        // Act
        var refreshResult = _authService.RefreshToken("invalid-access-token", "invalid-refresh-token");

        // Assert
        Assert.Null(refreshResult);
    }

    [Fact]
    public void RefreshToken_Returns_Failure_For_Non_Existent_User()
    {
        // Act
        var refreshResult = _authService.RefreshToken("access-token-for-tests", "refresh-token-for-tests");

        // Assert
        Assert.Null(refreshResult);
    }

    [Fact]
    public void RefreshToken_Returns_Failure_For_Invalid_Refresh_Token()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();
        _authService.Register(registerDto);
        var authResult = _authService.Authenticate(new LogInWDto { Username = registerDto.Username, Password = registerDto.Password });

        // Act
        var refreshResult = _authService.RefreshToken(authResult!.Token!.AccessToken, "invalid-refresh-token");

        // Assert
        Assert.Null(refreshResult);
    }

    [Fact]
    public void RevokeToken_Returns_Success()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();
        _authService.Register(registerDto);
        var authResult = _authService.Authenticate(new LogInWDto { Username = registerDto.Username, Password = registerDto.Password });

        // Act
        var revokeResult = _authService.RevokeToken(authResult!.Token!.AccessToken, authResult.Token!.RefreshToken!);

        // Assert
        Assert.True(revokeResult);
    }

    [Fact]
    public void RevokeToken_Returns_Failure_For_Invalid_Refresh_Token()
    {
        // Act
        var revokeResult = _authService.RevokeToken("access-token-for-tests", "invalid-refresh-token");

        // Assert
        Assert.False(revokeResult);
    }

    [Fact]
    public void ForgotPassword_Returns_Success()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();
        _authService.Register(registerDto);

        // Act
        var resetToken = _authService.ForgotPassword(registerDto.Email);

        // Assert
        Assert.NotNull(resetToken);
        Assert.Equal(registerDto.Email, resetToken!.User.Email);
        Assert.NotEmpty(resetToken.Token);
        Assert.False(resetToken.IsUsed);
        Assert.Equal(registerDto.Username, resetToken.User.Username);
        Assert.Equal(1, resetToken.UserId);
    }

    [Fact]
    public void ForgotPassword_Returns_Failure_For_Non_Existent_Email()
    {
        // Act
        var resetToken = _authService.ForgotPassword("nonexistent@example.com");

        // Assert
        Assert.Null(resetToken);
    }

    [Fact]
    public void ResetPassword_Returns_Success()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();
        _authService.Register(registerDto);
        var resetToken = _authService.ForgotPassword(registerDto.Email);

        var resetPasswordDto = new ResetPasswordDto
        {
            Email = registerDto.Email,
            Token = Encoding.UTF8.GetString(resetToken!.Token),
            NewPassword = "newpassword123"
        };

        // Act
        var resetResult = _authService.ResetPassword(resetPasswordDto, out var message);

        // Assert
        Assert.True(resetResult);
        Assert.Equal("Password has been reset successfully.", message);

        // Verify that the password was actually changed
        var user = _unitOfWork.UserRepository.GetByUsername(registerDto.Username);
        Assert.NotNull(user);
        Assert.True(BCrypt.Net.BCrypt.Verify(resetPasswordDto.NewPassword, user!.PasswordHash));
    }

    [Fact]
    public void ResetPassword_Returns_Failure_For_Non_Existent_User()
    {
        // Arrange
        var resetPasswordDto = new ResetPasswordDto
        {
            Email = "nonexistent@example.com",
            Token = "invalid-token",
            NewPassword = "newpassword123"
        };

        // Act
        var resetResult = _authService.ResetPassword(resetPasswordDto, out var message);

        // Assert
        Assert.False(resetResult);
        Assert.Equal("User not found.", message);
    }

    [Fact]
    public void ResetPassword_Returns_Failure_For_Invalid_Token()
    {
        // Arrange
        var registerDto = GetBasicRegisterDto();
        _authService.Register(registerDto);

        var resetPasswordDto = new ResetPasswordDto
        {
            Email = registerDto.Email,
            Token = "invalid-token",
            NewPassword = "newpassword123"
        };

        // Act
        var resetResult = _authService.ResetPassword(resetPasswordDto, out var message);

        // Assert
        Assert.False(resetResult);
        Assert.Equal("Invalid or expired token.", message);
    }

    private static RegisterWDto GetBasicRegisterDto()
    {
        return new RegisterWDto
        {
            Username = "testuser",
            Email = "test@example.com",
            Name = "Test",
            Surname = "User",
            Password = "password123",
            RoleId = 1,
            CompanyId = 1
        };
    }
}