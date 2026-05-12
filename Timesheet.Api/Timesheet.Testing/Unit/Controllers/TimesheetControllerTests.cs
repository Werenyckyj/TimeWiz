using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Timesheet.Core.Services.Mail;
using Timesheet.Core.Services.Timesheet;
using Timesheet.Data.Dtos;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;
using Timesheet.Web.Controllers;

namespace Timesheet.Testing.Unit.Controllers;

public class TimesheetControllerTests : TestBase
{
    private readonly TimesheetController _controller;
    public TimesheetControllerTests()
    {
        var mapperProfile = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<TsWeekWDto, TsWeek>();
                cfg.CreateMap<TsWeek, TsWeekRDto>();
                cfg.CreateMap<TsEntryWDto, TsEntry>();
                cfg.CreateMap<TsEntry, TsEntryRDto>();
                cfg.CreateMap<Project, ProjectRDto>();
            });
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
        var userProject = new UserProject
        {
            UserId = 99,
            ProjectId = 1,
            User = user,
            Project = project,
            ProjectRole = RoleTypes.Employee
        };

        project.UserProjects.Add(userProject);
        _unitOfWork.ProjectRepository.Add(project);
        _unitOfWork.UserRepository.Add(user);
        _unitOfWork.SaveChanges();

        var timesheetServiceMock = new Mock<ITimesheetService>();
        timesheetServiceMock
            .Setup(s => s.ManageApproval(It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<TsWeek>(), It.IsAny<TsWeekWDto>()))
            .Callback<bool, bool, TsWeek, TsWeekWDto>((_, _, tsWeek, tsWeekDto) =>
            {
                tsWeek.Status = tsWeekDto.Status;
            })
            .Returns(true);
        timesheetServiceMock.Setup(s => s.SendMailToManager(It.IsAny<TsWeek>())).Returns(Task.CompletedTask);
        timesheetServiceMock.Setup(s => s.SendMailToEmployee(It.IsAny<TsWeek>())).Returns(Task.CompletedTask);

        _controller = new TimesheetController(new Mock<ILogger<TimesheetController>>().Object, _unitOfWork.TsWeekRepository, realMapper, _unitOfWork, timesheetServiceMock.Object);
    }

    [Fact]
    public void Create_ReturnsCreatedAtActionResult_WhenTimesheetIsCreated()
    {
        // Arrange
        var newTsWeek = new TsWeekWDto
        {
            UserId = 99,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft,
            ProjectId = 1
        };

        // Act
        var result = _controller.Create(newTsWeek);

        // Assert
        var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result);
        var returnValue = Assert.IsType<TsWeekRDto>(createdAtActionResult.Value);
        Assert.Equal(newTsWeek.UserId, returnValue.UserId);
        Assert.Equal(newTsWeek.Year, returnValue.Year);
        Assert.Equal(newTsWeek.WeekNumber, returnValue.WeekNumber);
        Assert.Equal(5, returnValue.TsEntries.Count);
        Assert.Contains(returnValue.TsEntries, e => e.TsWeekId == returnValue.Id);
    }

    [Fact]
    public void Create_ReturnsNotFoundResult_WhenUserDoesNotExist()
    {
        // Arrange
        var newTsWeek = new TsWeekWDto
        {
            UserId = 999,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft,
            ProjectId = 1
        };

        // Act
        var result = _controller.Create(newTsWeek);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("User with ID 999 not found.", notFoundResult.Value);
    }

    [Fact]
    public void Create_ReturnsNotFoundResult_WhenProjectDoesNotExist()
    {
        // Arrange
        var newTsWeek = new TsWeekWDto
        {
            UserId = 99,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft,
            ProjectId = 999
        };

        // Act
        var result = _controller.Create(newTsWeek);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Project with ID 999 not found.", notFoundResult.Value);
    }

    [Fact]
    public void Create_ReturnsBadRequestResult_WhenTimesheetAlreadyExists()
    {
        // Arrange

        var newTsWeek = new TsWeekWDto
        {
            UserId = 99,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft,
            ProjectId = 1
        };
        _controller.Create(newTsWeek);

        // Act
        var result = _controller.Create(newTsWeek);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Timesheet for User ID 99, Year 2024, Week 24 already exists.", badRequestResult.Value);
    }

    [Fact]
    public async Task Update_ReturnsOkResult_WhenTimesheetIsUpdated()
    {
        // Arrange
        var newTsWeek = new TsWeekWDto
        {
            UserId = 99,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft,
            ProjectId = 1
        };
        var createResult = _controller.Create(newTsWeek);
        var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(createResult);
        var createdTsWeek = Assert.IsType<TsWeekRDto>(createdAtActionResult.Value);

        var updatedTsWeek = new TsWeekWDto
        {
            UserId = 99,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Submitted,
            ProjectId = 1
        };

        // Act
        var result = await _controller.UpdateAsync(createdTsWeek.Id, updatedTsWeek);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<TsWeekRDto>(okResult.Value);
        Assert.Equal(TsWeekStatus.Submitted, returnValue.Status);

        // Check if the entity was actually updated in the repository
        var updatedEntity = _unitOfWork.TsWeekRepository.GetById(createdTsWeek.Id);
        Assert.NotNull(updatedEntity);
        Assert.Equal(TsWeekStatus.Submitted, updatedEntity.Status);
    }

    [Fact]
    public async Task Update_ReturnsNotFoundResult_WhenTimesheetDoesNotExist()
    {
        // Arrange
        var updatedTsWeek = new TsWeekWDto
        {
            UserId = 99,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Submitted,
            ProjectId = 1
        };

        // Act
        var result = await _controller.UpdateAsync(999, updatedTsWeek);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Timesheet with ID 999 not found.", notFoundResult.Value);
    }

    [Fact]
    public async Task Update_ReturnsNotFoundResult_WhenUserDoesNotExist()
    {
        // Arrange
        var newTsWeek = new TsWeekWDto
        {
            UserId = 99,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft,
            ProjectId = 1
        };
        var createResult = _controller.Create(newTsWeek);
        var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(createResult);
        var createdTsWeek = Assert.IsType<TsWeekRDto>(createdAtActionResult.Value);

        var updatedTsWeek = new TsWeekWDto
        {
            UserId = 999,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Submitted,
            ProjectId = 1
        };

        // Act
        var result = await _controller.UpdateAsync(createdTsWeek.Id, updatedTsWeek);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("User with ID 999 not found.", notFoundResult.Value);
    }

    [Fact]
    public async Task Update_ReturnsNotFoundResult_WhenProjectDoesNotExist()
    {
        // Arrange
        var newTsWeek = new TsWeekWDto
        {
            UserId = 99,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft,
            ProjectId = 1
        };
        var createResult = _controller.Create(newTsWeek);
        var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(createResult);
        var createdTsWeek = Assert.IsType<TsWeekRDto>(createdAtActionResult.Value);

        var updatedTsWeek = new TsWeekWDto
        {
            UserId = 99,
            Year = 2024,
            WeekNumber = 24,
            StartDate = new DateTime(2024, 6, 10),
            DaysInWeek = 5,
            Status = TsWeekStatus.Submitted,
            ProjectId = 999
        };

        // Act
        var result = await _controller.UpdateAsync(createdTsWeek.Id, updatedTsWeek);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Project with ID 999 not found.", notFoundResult.Value);
    }
}