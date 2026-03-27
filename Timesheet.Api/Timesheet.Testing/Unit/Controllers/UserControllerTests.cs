using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Timesheet.Data.Dtos;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;
using Timesheet.Web.Controllers;

namespace Timesheet.Testing.Unit.Controllers;

public class UserControllerTests : TestBase
{
    private readonly UserController _controller;
    public UserControllerTests()
    {
        var mapperProfile = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<UserWDto, User>();
                cfg.CreateMap<User, UserRDto>();
                cfg.CreateMap<TsWeek, TsWeekRDto>();
                cfg.CreateMap<Project, ProjectRDto>();
            });
        var realMapper = mapperProfile.CreateMapper();
        var user = new User
        {
            Id = 99,
            Username = "testuser",
            Name = "Test",
            Surname = "User",
            Email = "test@example.com",
            PasswordHash = "hash",
            Role = new Role { Id = 99, Name = "Employee", Privilege = RoleTypes.Employee, Users = [] },
            Company = new Company { Id = 99, Name = "Test Company", Employees = [], CIN = "12345678" },
            TsWeeks = new List<TsWeek>(),
            UserProjects = new List<UserProject>(),
            PasswordResetTokens = new List<PasswordResetToken>(),
            TokenInfos = new List<TokenInfo>()
        };
        var timesheet = new TsWeek
        {
            Id = 1,
            UserId = 99,
            Year = 2024,
            WeekNumber = 1,
            Status = TsWeekStatus.Draft,
            User = user,
            Project = new Project { Id = 1, Name = "Test Project", Code = "TP", IsActive = true, TsWeeks = [], UserProjects = [] },
            Approval = new TsApproval { Id = 1, Action = TsApprovalStatus.Pending, TsWeekId = 1, ActionTime = DateTime.Now, TsWeek = null!, User = user, Managers = [] },
            TsEntries = []
        };
        _unitOfWork.UserRepository.Add(user);
        _unitOfWork.TsWeekRepository.Add(timesheet);
        _unitOfWork.SaveChanges();


        _controller = new UserController(new Mock<ILogger<UserController>>().Object, _unitOfWork.UserRepository, realMapper, _unitOfWork);
    }

    [Fact]
    public void GetUserTimesheets_ReturnsOkResult_WhenUserExists()
    {
        // Act
        var result = _controller.GetUserTimesheets(99, 2024, 1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<List<TsWeekRDto>>(okResult.Value);
        Assert.Single(returnValue);
        Assert.Equal(1, returnValue[0].Id);
    }

    [Fact]
    public void GetUserTimesheets_ReturnsNotFoundResult_WhenUserDoesNotExist()
    {
        // Act
        var result = _controller.GetUserTimesheets(999, 2024, 1);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public void GetUserTimesheets_ReturnsEmptyList_WhenUserHasNoTimesheets()
    {
        // Arrange
        var newUser = new User
        {
            Id = 100,
            Username = "emptyuser",
            Name = "Empty",
            Surname = "User",
            Email = "test@example.com",
            PasswordHash = "hash",
            Role = new Role { Id = 100, Name = "Employee", Privilege = RoleTypes.Employee, Users = [] },
            Company = new Company { Id = 100, Name = "Test Company", Employees = [], CIN = "12345678" },
            TsWeeks = new List<TsWeek>(),
            UserProjects = new List<UserProject>(),
            PasswordResetTokens = new List<PasswordResetToken>(),
            TokenInfos = new List<TokenInfo>()
        };
        _unitOfWork.UserRepository.Add(newUser);
        _unitOfWork.SaveChanges();

        // Act
        var result = _controller.GetUserTimesheets(100, 2024, 1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<List<TsWeekRDto>>(okResult.Value);
        Assert.Empty(returnValue);
    }

    [Fact]
    public void GetUserProjectTimesheets_ReturnsOkResult_WhenUserExists()
    {
        // Arrange
        var project = new Project { Id = 2, Name = "Test Project", Code = "TP", IsActive = true, TsWeeks = [], UserProjects = [] };
        var user = new User
        {
            Id = 101,
            Username = "testuser",
            Name = "Test",
            Surname = "User",
            Email = "test@example.com",
            PasswordHash = "hash",
            Role = new Role { Id = 101, Name = "Employee", Privilege = RoleTypes.Employee, Users = [] },
            Company = new Company { Id = 101, Name = "Test Company", Employees = [], CIN = "12345678" },
            TsWeeks = new List<TsWeek>(),
            UserProjects = new List<UserProject>(),
            PasswordResetTokens = new List<PasswordResetToken>(),
            TokenInfos = new List<TokenInfo>()
        };
        var timesheet = new TsWeek
        {
            Id = 2,
            UserId = 101,
            Year = 2024,
            WeekNumber = 1,
            Status = TsWeekStatus.Draft,
            User = user,
            Project = project,
            Approval = new TsApproval { Id = 2, Action = TsApprovalStatus.Pending, TsWeekId = 1, ActionTime = DateTime.Now, TsWeek = null!, User = user, Managers = [] },
            TsEntries = []
        };
        _unitOfWork.ProjectRepository.Add(project);
        _unitOfWork.UserRepository.Add(user);
        _unitOfWork.TsWeekRepository.Add(timesheet);
        _unitOfWork.SaveChanges();

        // Act
        var result = _controller.GetUserProjectTimesheets(101, 2, 1, 3, 2024, 1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var anonymousObject = okResult.Value;
        Assert.NotNull(anonymousObject);
        var type = anonymousObject.GetType();
        var totalRecords = (int)type.GetProperty("TotalRecords")!.GetValue(anonymousObject)!;
        var page = (int)type.GetProperty("Page")!.GetValue(anonymousObject)!;
        Assert.Equal(1, totalRecords);
        Assert.Equal(1, page);
        var timesheets = type.GetProperty("Data")!.GetValue(anonymousObject) as List<TsWeekRDto>;
        Assert.NotNull(timesheets);
        Assert.Single(timesheets);
        Assert.Equal(2, timesheets[0].Id);
    }

    [Fact]
    public void GetUserProjectTimesheets_ReturnsNotFoundResult_WhenUserDoesNotExist()
    {
        // Act
        var result = _controller.GetUserProjectTimesheets(999, 2, 1, 3, 2024, 1);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public void GetUserProjectTimesheets_ReturnsNotFoundResult_WhenProjectDoesNotExist()
    {
        // Act
        var result = _controller.GetUserProjectTimesheets(99, 999, 1, 3, 2024, 1);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public void GetUserProjectTimesheets_ReturnsEmptyList_WhenUserHasNoTimesheetsForProject()
    {
        // Arrange
        var project = new Project { Id = 2, Name = "Test Project", Code = "TP", IsActive = true, TsWeeks = [], UserProjects = [] };
        var user = new User
        {
            Id = 101,
            Username = "testuser",
            Name = "Test",
            Surname = "User",
            Email = "test@example.com",
            PasswordHash = "hash",
            Role = new Role { Id = 101, Name = "Employee", Privilege = RoleTypes.Employee, Users = [] },
            Company = new Company { Id = 101, Name = "Test Company", Employees = [], CIN = "12345678" },
            TsWeeks = new List<TsWeek>(),
            UserProjects = new List<UserProject>(),
            PasswordResetTokens = new List<PasswordResetToken>(),
            TokenInfos = new List<TokenInfo>()
        };
        _unitOfWork.ProjectRepository.Add(project);
        _unitOfWork.UserRepository.Add(user);
        _unitOfWork.SaveChanges();

        // Act
        var result = _controller.GetUserProjectTimesheets(101, 2, 1, 3, 2024, 1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var anonymousObject = okResult.Value;
        Assert.NotNull(anonymousObject);
        var type = anonymousObject.GetType();
        var totalRecords = (int)type.GetProperty("TotalRecords")!.GetValue(anonymousObject)!;
        var page = (int)type.GetProperty("Page")!.GetValue(anonymousObject)!;
        Assert.Equal(0, totalRecords);
        Assert.Equal(1, page);
        var timesheets = type.GetProperty("Data")!.GetValue(anonymousObject) as List<TsWeekRDto>;
        Assert.NotNull(timesheets);
        Assert.Empty(timesheets);
    }

    [Fact]
    public void GetUserProjects_ReturnsOkResult_WhenUserExists()
    {
        // Arrange
        var project = new Project { Id = 2, Name = "Test Project", Code = "TP", IsActive = true, TsWeeks = [], UserProjects = [] };
        var user = new User
        {
            Id = 101,
            Username = "testuser",
            Name = "Test",
            Surname = "User",
            Email = "test@example.com",
            PasswordHash = "hash",
            Role = new Role { Id = 101, Name = "Employee", Privilege = RoleTypes.Employee, Users = [] },
            Company = new Company { Id = 101, Name = "Test Company", Employees = [], CIN = "12345678" },
            TsWeeks = new List<TsWeek>(),
            UserProjects = new List<UserProject>(),
            PasswordResetTokens = new List<PasswordResetToken>(),
            TokenInfos = new List<TokenInfo>()
        };
        var userProject = new UserProject
        {
            UserId = 101,
            ProjectId = 2,
            User = user,
            Project = project,
            ProjectRole = RoleTypes.Employee
        };
        _unitOfWork.ProjectRepository.Add(project);
        _unitOfWork.UserRepository.Add(user);
        _unitOfWork.UserProjectRepository.Add(userProject);
        _unitOfWork.SaveChanges();

        // Act
        var result = _controller.GetUserProjects(101);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<List<ProjectRDto>>(okResult.Value);
        Assert.Single(returnValue);
        Assert.Equal(2, returnValue[0].Id);
    }

    [Fact]
    public void GetUserProjects_ReturnsNotFoundResult_WhenUserDoesNotExist()
    {
        // Act
        var result = _controller.GetUserProjects(999);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public void GetUserProjects_ReturnsEmptyList_WhenUserHasNoProjects()
    {
        // Arrange
        var user = new User
        {
            Id = 101,
            Username = "testuser",
            Name = "Test",
            Surname = "User",
            Email = "test@example.com",
            PasswordHash = "hash",
            Role = new Role { Id = 101, Name = "Employee", Privilege = RoleTypes.Employee, Users = [] },
            Company = new Company { Id = 101, Name = "Test Company", Employees = [], CIN = "12345678" },
            TsWeeks = new List<TsWeek>(),
            UserProjects = new List<UserProject>(),
            PasswordResetTokens = new List<PasswordResetToken>(),
            TokenInfos = new List<TokenInfo>()
        };
        _unitOfWork.UserRepository.Add(user);
        _unitOfWork.SaveChanges();

        // Act
        var result = _controller.GetUserProjects(101);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<List<ProjectRDto>>(okResult.Value);
        Assert.Empty(returnValue);
    }
}