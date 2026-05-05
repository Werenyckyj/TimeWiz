using System;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Timesheet.Data.Dtos;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Data.Enums;

namespace Timesheet.Testing.Integration.API;

public class ProjectApiTests : ApiTestsBase
{
    private CompanyRDto? _testCompany;
    private RoleRDto? _testRole;
    private ProjectRDto? _testProject;
    private UserRDto? _testUser;
    public ProjectApiTests(WebApplicationFactory<Program> factory) : base(factory)
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

        var projectReq = new ProjectWDto
        {
            Name = "Test Project",
            Code = "TP001",
            IsActive = true
        };

        var companyResponse = await _client.PostAsJsonAsync("api/company", companyReq);
        _testCompany = await companyResponse.Content.ReadFromJsonAsync<CompanyRDto>(JsonOptions);

        var roleResponse = await _client.PostAsJsonAsync("api/role", roleReq);
        _testRole = await roleResponse.Content.ReadFromJsonAsync<RoleRDto>(JsonOptions);

        var projectResponse = await _client.PostAsJsonAsync("api/project", projectReq);
        _testProject = await projectResponse.Content.ReadFromJsonAsync<ProjectRDto>(JsonOptions);


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
        var registerResponse = await _client.PostAsJsonAsync("api/auth/register", registerUser);
        _testUser = await registerResponse.Content.ReadFromJsonAsync<UserRDto>(JsonOptions);
    }

    [Fact]
    public async Task AssignUserToProject_ReturnsOk()
    {
        // Act
        var response = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadFromJsonAsync<string>(JsonOptions);
        Assert.Equal($"User with ID {_testUser?.Id} assigned to project with ID {_testProject?.Id}.", content);

        // Verify the user is assigned to the project
        var usersResponse = await _client.GetAsync($"api/project/{_testProject?.Id}/users");
        usersResponse.EnsureSuccessStatusCode();
        var users = await usersResponse.Content.ReadFromJsonAsync<List<UserRDto>>(JsonOptions);
        Assert.NotNull(users);
        Assert.Contains(users, u => u.Id == _testUser?.Id);
    }

    [Fact]
    public async Task AssignUserToProject_ReturnsNotFound()
    {
        // Act
        var response = await _client.PostAsJsonAsync($"api/project/9999/assign", _testUser?.Id);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AssignUserToProject_ReturnsBadRequest()
    {
        // Assert
        var assignResponse = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
        assignResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UnassignUserFromProject_ReturnsOk()
    {
        // Arrange
        var assignResponse = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
        assignResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/unassign", _testUser?.Id);

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadFromJsonAsync<string>(JsonOptions);
        Assert.Equal($"User with ID {_testUser?.Id} unassigned from project with ID {_testProject?.Id}.", content);

        // Verify the user is unassigned from the project
        var usersResponse = await _client.GetAsync($"api/project/{_testProject?.Id}/users");
        usersResponse.EnsureSuccessStatusCode();
        var users = await usersResponse.Content.ReadFromJsonAsync<List<UserRDto>>(JsonOptions);
        Assert.NotNull(users);
        Assert.DoesNotContain(users, u => u.Id == _testUser?.Id);
    }

    [Fact]
    public async Task UnassignUserFromProject_ReturnsNotFound()
    {
        // Act
        var response = await _client.PostAsJsonAsync($"api/project/9999/unassign", _testUser?.Id);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UnassignUserFromProject_ReturnsBadRequest()
    {
        // Act
        var response = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/unassign", _testUser?.Id);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetProjectUsers_ReturnsOk()
    {
        // Arrange
        var assignResponse = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
        assignResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.GetAsync($"api/project/{_testProject?.Id}/users");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var users = await response.Content.ReadFromJsonAsync<List<UserRDto>>(JsonOptions);
        Assert.NotNull(users);
        Assert.Single(users);
        Assert.Equal(_testUser?.Id, users?.First().Id);
    }

    [Fact]
    public async Task GetProjectUsers_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync($"api/project/9999/users");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetProjectPendingTimesheets_ReturnsOk()
    {
        // Arrange
        var assignResponse = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
        assignResponse.EnsureSuccessStatusCode();

        var tsWeekReq = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            Status = TsWeekStatus.Draft,
            DaysInWeek = 5,
            StartDate = new DateTime(2024, 1, 1),
        };
        var tsWeekResponse = await _client.PostAsJsonAsync("api/timesheet", tsWeekReq);
        tsWeekResponse.EnsureSuccessStatusCode();
        var updatedTsWeekReq = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            Status = TsWeekStatus.Submitted,
            DaysInWeek = 5,
            StartDate = new DateTime(2024, 1, 1),
        };
        var updateResponse = await _client.PutAsJsonAsync($"api/timesheet/{(await tsWeekResponse.Content.ReadFromJsonAsync<TsWeekRDto>(JsonOptions))?.Id}", updatedTsWeekReq);
        updateResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.GetAsync($"api/project/{_testProject?.Id}/pending-timesheets");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var timesheets = await response.Content.ReadFromJsonAsync<List<TsWeekRDto>>(JsonOptions);
        Assert.NotNull(timesheets);
        Assert.Single(timesheets);
        Assert.Equal(_testUser?.Id, timesheets?.First().UserId);
    }

    [Fact]
    public async Task GetProjectPendingTimesheets_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync($"api/project/9999/pending-timesheets");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetProjectPendingTimesheets_ReturnsEmptyList()
    {
        // Arrange
        var assignResponse = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
        assignResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.GetAsync($"api/project/{_testProject?.Id}/pending-timesheets");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var timesheets = await response.Content.ReadFromJsonAsync<List<TsWeekRDto>>(JsonOptions);
        Assert.NotNull(timesheets);
        Assert.Empty(timesheets);
    }
}
