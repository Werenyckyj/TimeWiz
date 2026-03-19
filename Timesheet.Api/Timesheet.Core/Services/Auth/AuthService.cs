using System;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Data.Models;

namespace Timesheet.Core.Services.Auth;

public class AuthService(UnitOfWork unitOfWork, IMapper mapper, ILogger<AuthService> logger) : IAuthService
{
    private readonly UnitOfWork _unitOfWork = unitOfWork;
    private readonly IMapper _mapper = mapper;
    private readonly ILogger<AuthService> _logger = logger;

    public LogInRDto Authenticate(LogInWDto dto)
    {
        throw new NotImplementedException();
    }

    public TokenDto RefreshToken(string accessToken, string refreshToken)
    {
        throw new NotImplementedException();
    }

    public string Register(RegisterWDto dto)
    {
        var existingUser = _unitOfWork.UserRepository.GetByUsername(dto.Username);
        if (existingUser != null)
        {
            _logger.LogWarning($"User already exists with username: {dto.Username}");
            return "User already exists.";
        }

        var role = _unitOfWork.RoleRepository.GetById(dto.RoleId);
        if (role == null)
        {
            _logger.LogWarning($"Role not found with ID: {dto.RoleId}");
            return "Role not found.";
        }

        var company = _unitOfWork.CompanyRepository.GetById(dto.CompanyId);
        if (company == null)
        {
            _logger.LogWarning($"Company not found with ID: {dto.CompanyId}");
            return "Company not found.";
        }

        var newUser = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Name = string.Empty,
            Surname = string.Empty,
            Email = string.Empty,
            Role = role,
            RoleId = dto.RoleId,
            Company = company,
            CompanyId = dto.CompanyId,
            TsWeeks = new List<TsWeek>(),
            UserProjects = new List<UserProject>(),
            PasswordResetTokens = new List<PasswordResetToken>(),
            TokenInfos = new List<TokenInfo>()
        };
        var createdUser = _unitOfWork.UserRepository.Add(newUser);
        if (createdUser == null)
        {
            _logger.LogError($"Failed to create user with username: {dto.Username}");
            return "Failed to create user.";
        }

        _unitOfWork.SaveChanges();
        _logger.LogInformation($"User created successfully with username: {dto.Username}");
        return "User created successfully.";
    }

    public bool RevokeToken(string accessToken, string refreshToken)
    {
        throw new NotImplementedException();
    }
}
