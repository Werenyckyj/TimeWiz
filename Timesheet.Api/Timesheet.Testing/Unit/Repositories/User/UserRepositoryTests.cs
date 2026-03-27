using System;
using Timesheet.Core.Repositories;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Testing.Unit.Repositories;

public class UserRepositoryTests : TestBase
{
    private UserRepository _repository;
    public UserRepositoryTests()
    {
        _repository = new UserRepository(_context);
    }

    [Fact]
    public void GetByUsername_Returns_Correct_User()
    {
        // Arrange
        var user = new User
        {
            Id = 999,
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
        };
        _repository.Add(user);
        _context.SaveChanges();

        // Act
        var result = _repository.GetByUsername("testuser");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(user.Id, result.Id);
    }

    [Fact]
    public void GetByUsername_Returns_Null_For_Non_Existing_Username()
    {
        // Act
        var result = _repository.GetByUsername("nonexisting");

        // Assert
        Assert.Null(result);
    }
}
