using System;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Org.BouncyCastle.Bcpg;
using Timesheet.Data.Dtos;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Data.Dtos.Page;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Testing.Integration.API;

public class UserApiTests : ApiTestsBase
{
    private CompanyRDto? _testCompany;
    private RoleRDto? _testRole;
    private ProjectRDto? _testProject;
    private UserRDto? _testUser;

    public UserApiTests(WebApplicationFactory<Program> factory) : base(factory)
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
        _testCompany = await companyResponse.Content.ReadFromJsonAsync<CompanyRDto>();

        var roleResponse = await _client.PostAsJsonAsync("api/role", roleReq);
        _testRole = await roleResponse.Content.ReadFromJsonAsync<RoleRDto>();

        var projectResponse = await _client.PostAsJsonAsync("api/project", projectReq);
        _testProject = await projectResponse.Content.ReadFromJsonAsync<ProjectRDto>();


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
        _testUser = await registerResponse.Content.ReadFromJsonAsync<UserRDto>();
    }

    [Fact]
    public async Task GetUserTimesheets_ReturnsOk_EmptyList()
    {
        // Act
        var response = await _client.GetAsync($"api/user/{_testUser?.Id}/timesheets?year=2024&week=1");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var timesheets = await response.Content.ReadFromJsonAsync<List<TsWeekRDto>>();
        Assert.NotNull(timesheets);
        Assert.Empty(timesheets);
    }

    [Fact]
    public async Task GetUserTimesheets_ReturnsOk()
    {
        // Arrange
        await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            Status = TsWeekStatus.Draft,
            DaysInWeek = 5,
            StartDate = new DateTime(2024, 1, 1),
            TsEntries = []
        };
        var createResponse = await _client.PostAsJsonAsync("api/timesheet", tsWeek);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.GetAsync($"api/user/{_testUser?.Id}/timesheets?year=2024&week=1");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var timesheets = await response.Content.ReadFromJsonAsync<List<TsWeekRDto>>();
        Assert.NotNull(timesheets);
        Assert.Single(timesheets);
        Assert.Equal(5, timesheets?.First().TsEntries.Count);
        Assert.Equal(0, timesheets?.First().TsEntries.Sum(e => e.Hours));
    }

    [Fact]
    public async Task GetUserTimesheets_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync($"api/user/9999/timesheets?year=2024&week=1");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetUserProjectTimesheets_ReturnsOk()
    {
        // Arrange
        await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            Status = TsWeekStatus.Draft,
            DaysInWeek = 5,
            StartDate = new DateTime(2024, 1, 1),
            TsEntries = []
        };
        var createResponse = await _client.PostAsJsonAsync("api/timesheet", tsWeek);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.GetAsync($"api/user/{_testUser?.Id}/project-timesheets?projectId={_testProject?.Id}&year=2024&week=1");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var timesheets = await response.Content.ReadFromJsonAsync<PaginatedResponse<TsWeekRDto>>();
        Assert.NotNull(timesheets);
        Assert.Single(timesheets.Data);
        Assert.Equal(5, timesheets?.Data.First().TsEntries.Count);
        Assert.Equal(0, timesheets?.Data.First().TsEntries.Sum(e => e.Hours));
    }

    [Fact]
    public async Task GetUserProjectTimesheets_ReturnsOk_EmptyListForTheProject()
    {
        // Arrange
        var anotherProjectReq = new ProjectWDto
        {
            Name = "Another Test Project",
            Code = "ATP001",
            IsActive = true
        };
        var anotherProjectResponse = await _client.PostAsJsonAsync("api/project", anotherProjectReq);
        var anotherProject = await anotherProjectResponse.Content.ReadFromJsonAsync<ProjectRDto>();
        var assignResponse = await _client.PostAsJsonAsync($"api/project/{anotherProject?.Id}/assign", _testUser?.Id);
        await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
        assignResponse.EnsureSuccessStatusCode();
        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            Status = TsWeekStatus.Draft,
            DaysInWeek = 5,
            StartDate = new DateTime(2024, 1, 1),
            TsEntries = []
        };
        var createResponse = await _client.PostAsJsonAsync("api/timesheet", tsWeek);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.GetAsync($"api/user/{_testUser?.Id}/project-timesheets?projectId={anotherProject?.Id}&year=2024&week=1");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var timesheets = await response.Content.ReadFromJsonAsync<PaginatedResponse<TsWeekRDto>>();
        Assert.NotNull(timesheets);
        Assert.Empty(timesheets.Data);
    }

    [Fact]
    public async Task GetUserProjectTimesheets_ReturnsNotFound_User()
    {
        // Act
        var response = await _client.GetAsync($"api/user/9999/project-timesheets?projectId=9999&year=2024&week=1");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetUserProjectTimesheets_ReturnsNotFound_Project()
    {
        // Act
        var response = await _client.GetAsync($"api/user/{_testUser?.Id}/project-timesheets?projectId=9999&year=2024&week=1");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetUserProjects_ReturnsOk()
    {
        // Arrange
        var assignResponse = await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
        assignResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.GetAsync($"api/user/{_testUser?.Id}/projects");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var projects = await response.Content.ReadFromJsonAsync<List<ProjectRDto>>();
        Assert.NotNull(projects);
        Assert.Single(projects);
        Assert.Equal(_testProject?.Id, projects?.First().Id);
    }

    [Fact]
    public async Task GetUserProjects_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync($"api/user/9999/projects");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }
}
