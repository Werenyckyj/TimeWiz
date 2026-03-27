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

public class GenericControllerTests : TestBase
{
    private readonly GenericController<Role, RoleWDto, RoleRDto> _controller;
    public GenericControllerTests()
    {
        var mapperProfile = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<RoleWDto, Role>();
                cfg.CreateMap<Role, RoleRDto>();
            });
        var realMapper = mapperProfile.CreateMapper();

        _controller = new GenericController<Role, RoleWDto, RoleRDto>(new Mock<ILogger<GenericController<Role, RoleWDto, RoleRDto>>>().Object, _unitOfWork.RoleRepository, realMapper);
    }

    [Fact]
    public void GetById_ReturnsOkResult_WhenEntityExists()
    {
        // Act
        var result = _controller.GetById(1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<RoleRDto>(okResult.Value);
        Assert.Equal(1, returnValue.Id);
        Assert.Equal("Admin", returnValue.Name);
    }

    [Fact]
    public void GetById_ReturnsNotFoundResult_WhenEntityDoesNotExist()
    {
        // Act
        var result = _controller.GetById(999);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public void Create_ReturnsOkResult_WhenEntityIsCreated()
    {
        // Arrange
        var newRole = new RoleWDto { Name = "New Role", Privilege = RoleTypes.Employee };

        // Act
        var result = _controller.Create(newRole);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<RoleRDto>(okResult.Value);
        Assert.Equal("New Role", returnValue.Name);

        // Check if the entity was actually added to the repository
        var createdEntity = _unitOfWork.RoleRepository.GetById(returnValue.Id);
        Assert.NotNull(createdEntity);
        Assert.Equal("New Role", createdEntity.Name);
    }

    [Fact]
    public void Update_ReturnsOkResult_WhenEntityIsUpdated()
    {
        // Arrange
        var updatedRole = new RoleWDto { Name = "Updated Role", Privilege = RoleTypes.Manager };

        // Act
        var result = _controller.Update(1, updatedRole);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<RoleRDto>(okResult.Value);
        Assert.Equal("Updated Role", returnValue.Name);

        // Check if the entity was actually updated in the repository
        var updatedEntity = _unitOfWork.RoleRepository.GetById(1);
        Assert.NotNull(updatedEntity);
        Assert.Equal("Updated Role", updatedEntity.Name);
    }

    [Fact]
    public void Update_ReturnsNotFoundResult_WhenEntityDoesNotExist()
    {
        // Arrange
        var updatedRole = new RoleWDto { Name = "Updated Role", Privilege = RoleTypes.Manager };

        // Act
        var result = _controller.Update(999, updatedRole);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public void Delete_ReturnsOkResult_WhenEntityIsDeleted()
    {
        // Act
        var result = _controller.Delete(1);

        // Assert
        Assert.IsType<OkResult>(result);

        // Check if the entity was actually deleted from the repository
        var deletedEntity = _unitOfWork.RoleRepository.GetById(1);
        Assert.Null(deletedEntity);
    }

    [Fact]
    public void Delete_ReturnsNotFoundResult_WhenEntityDoesNotExist()
    {
        // Act
        var result = _controller.Delete(999);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public void GetAll_ReturnsOkResult_WithListOfEntities()
    {
        // Act
        var result = _controller.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var anonymousObject = okResult.Value;
        Assert.NotNull(anonymousObject);
        var dataProperty = anonymousObject.GetType().GetProperty("data");
        Assert.NotNull(dataProperty);
        var returnValue = dataProperty.GetValue(anonymousObject) as IEnumerable<RoleRDto>;
        Assert.NotNull(returnValue);
    }
}
