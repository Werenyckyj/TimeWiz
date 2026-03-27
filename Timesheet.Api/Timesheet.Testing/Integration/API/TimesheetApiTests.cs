using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Timesheet.Data.Dtos;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Data.Enums;

namespace Timesheet.Testing.Integration.API;

public class TimesheetApiTests : ApiTestsBase
{
    private CompanyRDto? _testCompany;
    private RoleRDto? _testRole;
    private ProjectRDto? _testProject;
    private UserRDto? _testUser;
    public TimesheetApiTests(WebApplicationFactory<Program> factory)
    : base(factory)
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
        await _client.PostAsJsonAsync($"api/project/{_testProject?.Id}/assign", _testUser?.Id);
    }

    [Fact]
    public async Task GetUserTimesheets_ShouldReturnUnauthorized_WhenUserHasNoToken()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await _client.GetAsync("/api/user/1/timesheets?year=2024&week=1");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetUserTimesheets_ShouldNotReturnNotFound_ForWrongRoute()
    {
        // Act
        var response = await _client.GetAsync("/api/nonexistant-endpoint");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTimesheet_ShouldReturnCreated()
    {
        // Arrange
        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/timesheet", tsWeek);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var createdTimesheet = await response.Content.ReadFromJsonAsync<TsWeekRDto>();
        Assert.NotNull(createdTimesheet);
        Assert.Equal(tsWeek.UserId, createdTimesheet?.UserId);
        Assert.Equal(tsWeek.ProjectId, createdTimesheet?.Project.Id);
    }

    [Fact]
    public async Task CreateTimesheet_ShouldReturnBadRequest_Duplicate()
    {
        // Arrange
        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft
        };

        // Act
        var response1 = await _client.PostAsJsonAsync("/api/timesheet", tsWeek);
        var response2 = await _client.PostAsJsonAsync("/api/timesheet", tsWeek);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response1.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, response2.StatusCode);
    }

    [Fact]
    public async Task CreateTimesheet_ShouldReturnNotFound_InvalidUser()
    {
        // Arrange
        var tsWeek = new TsWeekWDto
        {
            UserId = 9999,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/timesheet", tsWeek);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTimesheet_ShouldReturnNotFound_InvalidProject()
    {
        // Arrange
        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = 9999,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/timesheet", tsWeek);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTimesheet_ShouldReturnBadRequest_UserNotAssignedToProject()
    {
        // Arrange
        var newProjectReq = new ProjectWDto
        {
            Name = "New Test Project",
            Code = "NTP001",
            IsActive = true
        };
        var newProjectResponse = await _client.PostAsJsonAsync("api/project", newProjectReq);
        var newProject = await newProjectResponse.Content.ReadFromJsonAsync<ProjectRDto>();

        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = newProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/timesheet", tsWeek);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateTimesheet_ShouldReturnOk()
    {
        // Arrange
        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft
        };
        var createResponse = await _client.PostAsJsonAsync("/api/timesheet", tsWeek);
        var createdTsWeek = await createResponse.Content.ReadFromJsonAsync<TsWeekRDto>();

        var updateTsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Submitted,
            TsEntries = createdTsWeek?.TsEntries.Select(e => new TsEntryWDto
            {
                WorkDate = e.WorkDate,
                Hours = 8
            }).ToList() ?? new List<TsEntryWDto>()
        };

        // Act
        var updateResponse = await _client.PutAsJsonAsync($"/api/timesheet/{createdTsWeek?.Id}", updateTsWeek);

        // Assert
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updatedTsWeek = await updateResponse.Content.ReadFromJsonAsync<TsWeekRDto>();
        Assert.NotNull(updatedTsWeek);
        Assert.Equal(updateTsWeek.Status, updatedTsWeek?.Status);
        Assert.Equal(updateTsWeek.TsEntries.Count, updatedTsWeek?.TsEntries.Count);
        Assert.All(updateTsWeek.TsEntries, e =>
        {
            var updatedEntry = updatedTsWeek?.TsEntries.FirstOrDefault(ue => ue.WorkDate == e.WorkDate);
            Assert.NotNull(updatedEntry);
            Assert.Equal(e.Hours, updatedEntry?.Hours);
        });
    }

    [Fact]
    public async Task UpdateTimesheet_ShouldReturnNotFound_InvalidTimesheet()
    {
        // Arrange
        var updateTsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Submitted
        };

        // Act
        var updateResponse = await _client.PutAsJsonAsync("/api/timesheet/9999", updateTsWeek);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, updateResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateTimesheet_ShouldReturnNotFound_InvalidUser()
    {
        // Arrange
        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft
        };
        var createResponse = await _client.PostAsJsonAsync("/api/timesheet", tsWeek);
        var createdTsWeek = await createResponse.Content.ReadFromJsonAsync<TsWeekRDto>();

        var updateTsWeek = new TsWeekWDto
        {
            UserId = 9999,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Submitted
        };

        // Act
        var updateResponse = await _client.PutAsJsonAsync($"/api/timesheet/{createdTsWeek?.Id}", updateTsWeek);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, updateResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateTimesheet_ShouldReturnNotFound_InvalidProject()
    {
        // Arrange
        var tsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = _testProject?.Id ?? 0,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Draft
        };
        var createResponse = await _client.PostAsJsonAsync("/api/timesheet", tsWeek);
        var createdTsWeek = await createResponse.Content.ReadFromJsonAsync<TsWeekRDto>();

        var updateTsWeek = new TsWeekWDto
        {
            UserId = _testUser?.Id ?? 0,
            ProjectId = 9999,
            Year = 2024,
            WeekNumber = 1,
            StartDate = new DateTime(2024, 1, 1),
            DaysInWeek = 5,
            Status = TsWeekStatus.Submitted
        };

        // Act
        var updateResponse = await _client.PutAsJsonAsync($"/api/timesheet/{createdTsWeek?.Id}", updateTsWeek);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, updateResponse.StatusCode);
    }
}
