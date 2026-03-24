using System;
using Microsoft.EntityFrameworkCore;
using Timesheet.Core.Repositories;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Testing.Unit.Repositories;

public class TRepositoryTests : TestBase
{
    [Fact]
    public void GetAll_ReturnsAllEntities()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);

        // Act
        var result = repo.GetAll().ToList();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(Enum.GetValues<RoleTypes>().Length, result.Count);
    }

    [Fact]
    public void GetById_ReturnsCorrectEntity()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);
        var role = new Role { Name = "TestRole", Privilege = RoleTypes.Employee, Users = [] };
        repo.Add(role);
        _context.SaveChanges();

        // Act
        var result = repo.GetById(role.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(role.Name, result.Name);
    }

    [Fact]
    public void GetById_Returns_Null_For_Non_Existing_Entity()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);

        // Act
        var result = repo.GetById(-1);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void Update_Returns_Updated_Entity()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);
        var role = new Role { Name = "TestRole", Privilege = RoleTypes.Employee, Users = [] };
        repo.Add(role);
        _context.SaveChanges();

        // Act
        role.Name = "UpdatedRole";
        repo.Update(role);
        _context.SaveChanges();

        // Assert
        var updatedRole = repo.GetById(role.Id);
        Assert.NotNull(updatedRole);
        Assert.Equal("UpdatedRole", updatedRole.Name);
    }

    [Fact]
    public void Update_Returns_Null_For_Non_Existing_Entity()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);
        var role = new Role { Id = -1, Name = "NonExistingRole", Privilege = RoleTypes.Employee, Users = [] };

        // Act
        var result = repo.Update(role);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(EntityState.Modified, _context.Entry(role).State);
    }

    [Fact]
    public void DeleteById_Returns_True()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);
        var role = new Role { Name = "TestRole", Privilege = RoleTypes.Employee, Users = [] };
        repo.Add(role);
        _context.SaveChanges();

        // Act
        var result = repo.DeleteById(role.Id);
        _context.SaveChanges();

        // Assert
        Assert.True(result);
        Assert.Null(repo.GetById(role.Id));
    }

    [Fact]
    public void DeleteById_Returns_False_For_Non_Existing_Entity()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);

        // Act
        var result = repo.DeleteById(-1);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void Delete_Removes_Entity()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);
        var role = new Role { Name = "TestRole", Privilege = RoleTypes.Employee, Users = [] };
        repo.Add(role);
        _context.SaveChanges();

        // Act
        repo.Delete(role);
        _context.SaveChanges();

        // Assert
        Assert.Null(repo.GetById(role.Id));
    }

    [Fact]
    public void Delete_Detached_Entity_Removes_Entity()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);
        var role = new Role { Name = "TestRole", Privilege = RoleTypes.Employee, Users = [] };
        repo.Add(role);
        _context.SaveChanges();

        // Detach the entity
        _context.Entry(role).State = EntityState.Detached;

        // Act
        repo.Delete(role);
        _context.SaveChanges();

        // Assert
        Assert.Null(repo.GetById(role.Id));
    }

    [Fact]
    public void Where_Returns_Filtered_Entities()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);

        // Act
        var result = repo.Where(r => r.Privilege == RoleTypes.Employee).ToList();

        // Assert
        Assert.Single(result);
        Assert.Equal("Employee", result[0].Name);
    }

    [Fact]
    public void Count_Returns_Correct_Number_Of_Entities()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);

        // Act
        var count = repo.Count();

        // Assert
        Assert.Equal(Enum.GetValues<RoleTypes>().Length, count);
    }

    [Fact]
    public void Queryable_Returns_IQueryable()
    {
        // Arrange
        var repo = new TRepository<Role>(_context);

        // Act
        var result = repo.GetAll();

        // Assert
        Assert.IsAssignableFrom<IQueryable<Role>>(result);
    }
}
