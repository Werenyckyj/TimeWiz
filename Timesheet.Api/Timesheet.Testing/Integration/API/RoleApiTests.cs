using System;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Timesheet.Data.Dtos;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Testing.Integration.API;

public class RoleApiTests(WebApplicationFactory<Program> factory) : ApiTestsBase(factory)
{
    [Fact]
    public async Task CreateRole_ReturnsOk()
    {
        // Arrange
        var roleDto = new RoleWDto
        {
            Name = "Test role",
            Privilege = RoleTypes.Employee
        };

        // Act
        var result = await _client.PostAsJsonAsync("api/role", roleDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
        result.EnsureSuccessStatusCode();
        var createdRole = await result.Content.ReadFromJsonAsync<RoleRDto>(JsonOptions);
        Assert.Equal(roleDto.Name, createdRole!.Name);
        Assert.Equal(roleDto.Privilege, createdRole.Privilege);

        // Verify that the role was actually created in the database
        var getResult = await _client.GetAsync($"api/role/{createdRole.Id}");
        Assert.Equal(HttpStatusCode.OK, getResult.StatusCode);
        var fetchedRole = await getResult.Content.ReadFromJsonAsync<RoleRDto>(JsonOptions);
        Assert.Equal(createdRole.Id, fetchedRole!.Id);
        Assert.Equal(createdRole.Name, fetchedRole.Name);
    }

    [Fact]
    public async Task GetAllRoles_ResturnsOk()
    {
        // Arrange
        var roleDto = new RoleWDto
        {
            Name = "Test role",
            Privilege = RoleTypes.Employee
        };
        await _client.PostAsJsonAsync("api/role", roleDto);

        // Act
        var result = await _client.GetAsync("api/role");

        // Assert
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
    }

    [Fact]
    public async Task UpdateRole_ReturnsOk()
    {
        // Arrange
        var roleDto = new RoleWDto
        {
            Name = "Test role",
            Privilege = RoleTypes.Employee
        };
        var createResult = await _client.PostAsJsonAsync("api/role", roleDto);
        createResult.EnsureSuccessStatusCode();
        var createdRole = await createResult.Content.ReadFromJsonAsync<RoleRDto>(JsonOptions);

        var updatedRoleDto = new RoleWDto
        {
            Name = "Updated test role",
            Privilege = RoleTypes.Manager
        };

        // Act
        var updateResult = await _client.PutAsJsonAsync($"api/role/{createdRole!.Id}", updatedRoleDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, updateResult.StatusCode);
        var getResult = await _client.GetAsync($"api/role/{createdRole.Id}");
        getResult.EnsureSuccessStatusCode();
        var fetchedRole = await getResult.Content.ReadFromJsonAsync<RoleRDto>(JsonOptions);
        Assert.Equal(updatedRoleDto.Name, fetchedRole!.Name);
        Assert.Equal(updatedRoleDto.Privilege, fetchedRole.Privilege);
    }

    [Fact]
    public async Task DeleteRole_ReturnsOk()
    {
        // Arrange
        var roleDto = new RoleWDto
        {
            Name = "Test role",
            Privilege = RoleTypes.Employee
        };
        var createResult = await _client.PostAsJsonAsync("api/role", roleDto);
        createResult.EnsureSuccessStatusCode();
        var createdRole = await createResult.Content.ReadFromJsonAsync<RoleRDto>(JsonOptions);

        // Act
        var deleteResult = await _client.DeleteAsync($"api/role/{createdRole!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, deleteResult.StatusCode);
        var getResult = await _client.GetAsync($"api/role/{createdRole.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResult.StatusCode);
    }
}
