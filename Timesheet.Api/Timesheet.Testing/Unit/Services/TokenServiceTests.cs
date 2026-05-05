using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Timesheet.Core.Services.Auth;
using Xunit;

namespace Timesheet.Testing.Unit.Services;

public class TokenServiceTests
{
    private readonly TokenService _tokenService;
    private readonly IConfiguration _configuration;

    public TokenServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string?> {
            {"JWT:Secret", "ThisIsASecretKeyForTestingPurposesOnly!ThisIsASecretKeyForTestingPurposesOnly!"},
            {"JWT:ValidIssuer", "TimesheetApiTest"},
            {"JWT:ValidAudience", "TimesheetAppTest"}
        };

        Environment.SetEnvironmentVariable("JWT_SECRET", "ThisIsASecretKeyForTestingPurposesOnly!");
        Environment.SetEnvironmentVariable("JWT_ISSUER", "TimesheetApiTest");
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", "TimesheetAppTest");

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var loggerMock = new Mock<ILogger<TokenService>>();

        _tokenService = new TokenService(_configuration, loggerMock.Object);
    }

    [Fact]
    public void GenerateAccessToken_Returns_Valid_Token()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Name, "testuser"),
            new Claim(ClaimTypes.Role, "Employee")
        };

        // Act
        var token = _tokenService.GenerateAccessToken(claims);

        // Assert
        Assert.False(string.IsNullOrEmpty(token));
        Assert.Equal(3, token.Split('.').Length);
    }

    [Fact]
    public void GenerateRefreshToken_Returns_Valid_Token()
    {
        // Act
        var token = _tokenService.GenerateRefreshToken();

        // Assert
        Assert.False(string.IsNullOrEmpty(token));
        Assert.Equal(44, token.Length);
    }

    [Fact]
    public void GetUserIdFromAccessToken_Returns_Correct_UserId()
    {
        // Arrange
        var expectedUserId = 1;
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, expectedUserId.ToString()),
        };
        var token = _tokenService.GenerateAccessToken(claims);


        // Act
        var userId = _tokenService.GetUserIdFromAccessToken(token);

        // Assert
        Assert.Equal(expectedUserId, userId);
    }

    [Fact]
    public void GetUserIdFromAccessToken_Returns_Zero_For_Invalid_Token()
    {
        // Arrange
        var invalidToken = "invalid.token.value";

        // Act
        var userId = _tokenService.GetUserIdFromAccessToken(invalidToken);

        // Assert
        Assert.Equal(0, userId);
    }

    [Fact]
    public void GetUserIdFromAccessToken_Returns_Zero_For_Token_Without_UserId()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, "testuser"),
        };
        var token = _tokenService.GenerateAccessToken(claims);

        // Act
        var userId = _tokenService.GetUserIdFromAccessToken(token);

        // Assert
        Assert.Equal(0, userId);
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_Returns_ClaimsPrincipal()
    {
        // Arrange
        var expectedUserId = 1;
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, expectedUserId.ToString()),
            new(ClaimTypes.Name, "expireduser"),
        };
        var token = _tokenService.GenerateAccessToken(claims);

        // Act
        var principal = _tokenService.GetPrincipalFromExpiredToken(token);

        // Assert
        Assert.NotNull(principal);
        var userIdClaim = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        Assert.NotNull(userIdClaim);
        Assert.Equal(expectedUserId.ToString(), userIdClaim.Value);
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_Returns_Null_For_Invalid_Token()
    {
        // Arrange
        var invalidToken = "invalid.token.value";

        // Act
        var principal = _tokenService.GetPrincipalFromExpiredToken(invalidToken);

        // Assert
        Assert.Null(principal);
    }
}
