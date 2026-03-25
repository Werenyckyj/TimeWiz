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

public class ProjectControllerTests : TestBase
{
    private readonly ProjectController _controller;

    public ProjectControllerTests()
    {
        var mapperProfile = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<ProjectWDto, Project>();
                cfg.CreateMap<Project, ProjectRDto>();
                cfg.CreateMap<UserWDto, User>();
                cfg.CreateMap<User, UserRDto>();
                cfg.CreateMap<TsWeek, TsWeekRDto>();
            }, NullLoggerFactory.Instance);
        var realMapper = mapperProfile.CreateMapper();
        var project = new Project
        {
            Id = 1,
            Name = "Test Project",
            Code = "TP",
            IsActive = true,
            TsWeeks = new List<TsWeek>(),
            UserProjects = new List<UserProject>()
        };
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
        _unitOfWork.ProjectRepository.Add(project);
        _unitOfWork.UserRepository.Add(user);
        _unitOfWork.SaveChanges();

        _controller = new ProjectController(new Mock<ILogger<ProjectController>>().Object, _unitOfWork.ProjectRepository, realMapper, _unitOfWork);
    }

    [Fact]
    public void AssignUserToProject_ReturnsOkResult_WhenAssignmentIsSuccessful()
    {
        // Act
        var result = _controller.AssignUserToProject(1, 99);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("User with ID 99 assigned to project with ID 1.", okResult.Value);

        // Verify that the user is assigned to the project
        var project = _unitOfWork.ProjectRepository.GetById(1);
        Assert.Contains(project!.UserProjects, up => up.UserId == 99);
    }

    [Fact]
    public void AssignUserToProject_ReturnsNotFound_WhenProjectDoesNotExist()
    {
        // Act
        var result = _controller.AssignUserToProject(999, 99);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Project with ID 999 not found.", notFoundResult.Value);
    }

    [Fact]
    public void AssignUserToProject_ReturnsNotFound_WhenUserDoesNotExist()
    {
        // Act
        var result = _controller.AssignUserToProject(1, 999);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("User with ID 999 not found.", notFoundResult.Value);
    }

    [Fact]
    public void AssignUserToProject_ReturnsBadRequest_WhenUserAlreadyAssigned()
    {
        // Arrange
        _controller.AssignUserToProject(1, 99);

        // Act
        var result = _controller.AssignUserToProject(1, 99);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("User with ID 99 is already assigned to project with ID 1.", badRequestResult.Value);
    }

    [Fact]
    public void UnassignUserFromProject_ReturnsOkResult_WhenUnassignmentIsSuccessful()
    {
        // Arrange
        _controller.AssignUserToProject(1, 99);

        // Act
        var result = _controller.UnassignUserFromProject(1, 99);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("User with ID 99 unassigned from project with ID 1.", okResult.Value);

        // Verify that the user is unassigned from the project
        var project = _unitOfWork.ProjectRepository.GetById(1);
        Assert.DoesNotContain(project!.UserProjects, up => up.UserId == 99);
    }

    [Fact]
    public void UnassignUserFromProject_ReturnsNotFound_WhenProjectDoesNotExist()
    {
        // Act
        var result = _controller.UnassignUserFromProject(999, 99);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Project with ID 999 not found.", notFoundResult.Value);
    }

    [Fact]
    public void UnassignUserFromProject_ReturnsNotFound_WhenUserDoesNotExist()
    {
        // Act
        var result = _controller.UnassignUserFromProject(1, 999);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("User with ID 999 not found.", notFoundResult.Value);
    }

    [Fact]
    public void UnassignUserFromProject_ReturnsBadRequest_WhenUserNotAssigned()
    {
        // Act
        var result = _controller.UnassignUserFromProject(1, 99);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("User with ID 99 is not assigned to project with ID 1.", badRequestResult.Value);
    }

    [Fact]
    public void GetProjectUsers_ReturnsOkResult_WithListOfUsers()
    {
        // Arrange
        _controller.AssignUserToProject(1, 99);

        // Act
        var result = _controller.GetProjectUsers(1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var users = Assert.IsType<List<UserRDto>>(okResult.Value);
        Assert.Single(users);
        Assert.Equal("testuser", users[0].Username);
    }

    [Fact]
    public void GetProjectUsers_ReturnsNotFound_WhenProjectDoesNotExist()
    {
        // Act
        var result = _controller.GetProjectUsers(999);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Project with ID 999 not found.", notFoundResult.Value);
    }

    [Fact]
    public void GetProjectUsers_ReturnsEmptyList_WhenNoUsersAssigned()
    {
        // Act
        var result = _controller.GetProjectUsers(1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var users = Assert.IsType<List<UserRDto>>(okResult.Value);
        Assert.Empty(users);
    }

    [Fact]
    public void GetProjectPendingTimesheets_ReturnsOkResult_WithListOfTsWeeks()
    {
        // Arrange
        var tsWeek = new TsWeek
        {
            Id = 1,
            UserId = 99,
            Year = 2024,
            WeekNumber = 1,
            Status = TsWeekStatus.Submitted,
            User = _unitOfWork.UserRepository.GetById(99)!,
            Project = _unitOfWork.ProjectRepository.GetById(1)!,
            Approval = new TsApproval
            {
                Id = 1,
                Action = TsApprovalStatus.Pending,
                ActionTime = DateTime.UtcNow,
                TsWeek = null!,
                User = _unitOfWork.UserRepository.GetById(99)!,
                Managers = new List<User>()
            },
            TsEntries = new List<TsEntry>()
        };
        _unitOfWork.TsWeekRepository.Add(tsWeek);
        _unitOfWork.SaveChanges();

        // Act
        var result = _controller.GetProjectPendingTimesheets(1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var tsWeeks = Assert.IsType<List<TsWeekRDto>>(okResult.Value);
        Assert.Single(tsWeeks);
        Assert.Equal(TsWeekStatus.Submitted, tsWeeks[0].Status);
    }

    [Fact]
    public void GetProjectPendingTimesheets_ReturnsNotFound_WhenProjectDoesNotExist()
    {
        // Act
        var result = _controller.GetProjectPendingTimesheets(999);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Project with ID 999 not found.", notFoundResult.Value);
    }
}
