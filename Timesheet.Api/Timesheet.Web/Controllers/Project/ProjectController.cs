using System;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Timesheet.Core;
using Timesheet.Data.Dtos;
using Timesheet.Data.Enums;
using Timesheet.Data.Models;

namespace Timesheet.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Manager, Admin, Employee, Externist")]
public class ProjectController(ILogger<ProjectController> logger, ITRepository<Project> tRepository, IMapper mapper, UnitOfWork unitOfWork) : GenericController<Project, ProjectWDto, ProjectRDto>(logger, tRepository, mapper)
{
    private readonly UnitOfWork _unitOfWork = unitOfWork;

    [HttpPost("{id:int}/assign")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Roles = "Admin, Manager")]
    public IActionResult AssignUserToProject(int id, [FromBody] int userId)
    {
        var project = _unitOfWork.ProjectRepository.Query()
        .Include(p => p.UserProjects)
        .FirstOrDefault(p => p.Id == id);
        if (project == null) return NotFound($"Project with ID {id} not found.");

        var user = _unitOfWork.UserRepository.GetById(userId);
        if (user == null) return NotFound($"User with ID {userId} not found.");

        if (project.UserProjects?.Any(u => u.UserId == userId) == true)
        {
            return BadRequest($"User with ID {userId} is already assigned to project with ID {id}.");
        }

        var userProject = new UserProject
        {
            UserId = userId,
            ProjectId = id,
            User = user,
            Project = project,
            ProjectRole = RoleTypes.Employee
        };
        _unitOfWork.UserProjectRepository.Add(userProject);
        _unitOfWork.SaveChanges();

        return Ok($"User with ID {userId} assigned to project with ID {id}.");
    }

    [HttpPost("{id:int}/unassign")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Roles = "Admin, Manager")]
    public IActionResult UnassignUserFromProject(int id, [FromBody] int userId)
    {
        var project = _unitOfWork.ProjectRepository.Query()
        .Include(p => p.UserProjects)
        .FirstOrDefault(p => p.Id == id);
        if (project == null) return NotFound($"Project with ID {id} not found.");

        var user = _unitOfWork.UserRepository.GetById(userId);
        if (user == null) return NotFound($"User with ID {userId} not found.");

        var userProject = project.UserProjects.FirstOrDefault(u => u.UserId == userId);
        if (userProject == null)
        {
            return BadRequest($"User with ID {userId} is not assigned to project with ID {id}.");
        }

        _unitOfWork.UserProjectRepository.Delete(userProject);
        _unitOfWork.SaveChanges();

        return Ok($"User with ID {userId} unassigned from project with ID {id}.");
    }

    [HttpPost("{id:int}/set-as-manager")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Roles = "Admin, Manager")]
    public IActionResult SetUserAsProjectManager(int id, [FromBody] int userId)
    {
        var project = _unitOfWork.ProjectRepository.Query()
        .Include(p => p.UserProjects)
        .FirstOrDefault(p => p.Id == id);
        if (project == null) return NotFound($"Project with ID {id} not found.");

        var user = _unitOfWork.UserRepository.Query().Include(u => u.Role).FirstOrDefault(u => u.Id == userId);
        if (user == null) return NotFound($"User with ID {userId} not found.");

        var userProject = project.UserProjects.FirstOrDefault(u => u.UserId == userId);
        if (userProject == null)
        {
            return BadRequest($"User with ID {userId} is not assigned to project with ID {id}.");
        }

        if (user.Role.Privilege == RoleTypes.Employee)
        {
            var managerRole = _unitOfWork.RoleRepository.Query().FirstOrDefault(r => r.Privilege == RoleTypes.Manager);

            if (managerRole != null)
            {
                user.RoleId = managerRole.Id;
                user.Role = managerRole;
                _unitOfWork.UserRepository.Update(user);
                _unitOfWork.SaveChanges();
            }
        }

        userProject.ProjectRole = RoleTypes.Manager;
        _unitOfWork.UserProjectRepository.Update(userProject);
        _unitOfWork.SaveChanges();

        return Ok($"User with ID {userId} set as manager for project with ID {id}.");
    }

    [HttpPost("{id:int}/set-as-employee")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Roles = "Admin, Manager")]
    public IActionResult SetUserAsProjectEmployee(int id, [FromBody] int userId)
    {
        var project = _unitOfWork.ProjectRepository.Query()
        .Include(p => p.UserProjects)
        .FirstOrDefault(p => p.Id == id);
        if (project == null) return NotFound($"Project with ID {id} not found.");

        var user = _unitOfWork.UserRepository.GetById(userId);
        if (user == null) return NotFound($"User with ID {userId} not found.");

        var userProject = project.UserProjects.FirstOrDefault(u => u.UserId == userId);
        if (userProject == null)
        {
            return BadRequest($"User with ID {userId} is not assigned to project with ID {id}.");
        }

        userProject.ProjectRole = RoleTypes.Employee;
        _unitOfWork.UserProjectRepository.Update(userProject);
        _unitOfWork.SaveChanges();

        return Ok($"User with ID {userId} set as employee for project with ID {id}.");
    }

    [HttpGet("{id:int}/users")]
    [ProducesResponseType(typeof(List<UserRDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetProjectUsers(int id)
    {
        var project = _unitOfWork.ProjectRepository
        .Query()
        .Include(p => p.UserProjects)
        .ThenInclude(up => up.User)
        .FirstOrDefault(p => p.Id == id);
        if (project == null) return NotFound($"Project with ID {id} not found.");

        var users = project.UserProjects.Select(up => up.User).ToList();
        var response = _mapper.Map<List<UserRDto>>(users);
        return Ok(response);
    }

    [HttpGet("{id:int}/managers")]
    [ProducesResponseType(typeof(List<UserRDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Roles = "Admin, Manager, Employee, Externist")]
    public IActionResult GetProjectManagers(int id)
    {
        var project = _unitOfWork.ProjectRepository
        .Query()
        .Include(p => p.UserProjects)
        .ThenInclude(up => up.User)
        .FirstOrDefault(p => p.Id == id);
        if (project == null) return NotFound($"Project with ID {id} not found.");

        var managers = project.UserProjects.Where(up => up.ProjectRole == RoleTypes.Manager).Select(up => up.User).ToList();
        var response = _mapper.Map<List<UserRDto>>(managers);
        return Ok(response);
    }

    [HttpGet("{id:int}/pending-timesheets")]
    [ProducesResponseType(typeof(List<TsWeekRDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [Authorize(Roles = "Admin, Manager, Externist")]
    public IActionResult GetProjectPendingTimesheets(int id)
    {
        var pendingTimesheets = _unitOfWork.TsWeekRepository.Query()
            .Include(t => t.User)
            .Include(t => t.TsEntries)
            .Include(t => t.Project)
            .Where(t => t.ProjectId == id && t.Approval != null && t.Approval.Action == TsApprovalStatus.Pending)
            .ToList();
        var response = _mapper.Map<List<TsWeekRDto>>(pendingTimesheets);
        return Ok(response);
    }
}
