using System;
using Timesheet.Core.Repositories;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Testing.Unit.Repositories.Token;

public class TokenRepositoryTests : TestBase
{
    private readonly TokenRepository _tokenRepository;
    public TokenRepositoryTests()
    {
        _tokenRepository = new TokenRepository(_context);
    }

    [Fact]
    public void GetByUserId_Returns_Correct_TokenInfo()
    {
        // Arrange
        var tokenInfo = new TokenInfo
        {
            UserId = 1,
            RefreshToken = "test-token",
            Expiration = DateTime.UtcNow.AddHours(1),
            User = new User
            {
                Id = 1,
                Username = "testuser",
                PasswordHash = "hash",
                RoleId = 1,
                Name = "Test",
                Surname = "User",
                Email = "test@example.com",
                Role = new Role { Id = 999, Privilege = RoleTypes.Employee, Name = "User", Users = [] },
                Company = new Company { Id = 999, Name = "Test Company", CIN = "12345678", Employees = [] },
                TsWeeks = new List<TsWeek>(),
                UserProjects = new List<UserProject>(),
                PasswordResetTokens = new List<PasswordResetToken>(),
                TokenInfos = new List<TokenInfo>()
            }
        };
        _tokenRepository.Add(tokenInfo);
        _context.SaveChanges();

        // Act
        var result = _tokenRepository.GetByUserId(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(tokenInfo.UserId, result.UserId);
    }

    [Fact]
    public void GetByUserId_Returns_Null_For_Non_Existing_UserId()
    {
        // Act
        var result = _tokenRepository.GetByUserId(-1);

        // Assert
        Assert.Null(result);
    }
}
