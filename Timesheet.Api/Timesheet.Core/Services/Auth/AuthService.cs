using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.Extensions.Logging;
using Timesheet.Data;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Data.Models;

namespace Timesheet.Core.Services.Auth;

public class AuthService(UnitOfWork unitOfWork, IMapper mapper, ILogger<AuthService> logger, ITokenService tokenService) : IAuthService
{
    private readonly UnitOfWork _unitOfWork = unitOfWork;
    private readonly IMapper _mapper = mapper;
    private readonly ILogger<AuthService> _logger = logger;
    private readonly ITokenService _tokenService = tokenService;
    public LogInRDto Authenticate(LogInWDto dto)
    {
        try
        {
            var user = _unitOfWork.UserRepository.GetByUsername(dto.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                _logger.LogWarning($"Authentication failed for username: {dto.Username}");
                return null;
            }

            List<Claim> claims = [
                new Claim(ClaimTypes.Name, user.Username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        ];

            var userRole = _unitOfWork.RoleRepository.GetById(user.RoleId);
            claims.Add(new Claim(ClaimTypes.Role, userRole!.Name));

            var token = _tokenService.GenerateAccessToken(claims);

            var refreshToken = _tokenService.GenerateRefreshToken();

            var tokenInfo = _unitOfWork.TokenInfoRepository.GetByUserId(user.Id);

            if (tokenInfo is null)
            {
                tokenInfo = new TokenInfo
                {
                    UserId = user.Id,
                    User = user,
                    RefreshToken = refreshToken,
                    Expiration = DateTime.UtcNow.AddDays(7)
                };
                _unitOfWork.TokenInfoRepository.Add(tokenInfo!);
            }
            else
            {
                tokenInfo.RefreshToken = refreshToken;
                tokenInfo.Expiration = DateTime.UtcNow.AddDays(7);
                _unitOfWork.TokenInfoRepository.Update(tokenInfo!);
            }

            _unitOfWork.SaveChanges();

            return new LogInRDto
            {
                Username = user.Username,
                IsAuthorized = true,
                Token = new TokenDto
                {
                    AccessToken = token,
                    RefreshToken = refreshToken,
                    ExpirationTime = tokenInfo.Expiration,
                    UserId = user.Id
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"An error occurred during authentication for username: {dto.Username}");
            return null;
        }

    }

    public TokenDto RefreshToken(string accessToken, string refreshToken)
    {
        try
        {
            var principal = _tokenService.GetPrincipalFromExpiredToken(accessToken);
            var username = principal.Identity!.Name;

            var user = _unitOfWork.UserRepository.GetByUsername(username!);
            if (user == null)
            {
                _logger.LogWarning($"User not found for username: {username}");
                return null;
            }

            var tokenInfo = _unitOfWork.TokenInfoRepository.GetByUserId(user.Id);
            if (tokenInfo is null || tokenInfo.RefreshToken != refreshToken || tokenInfo.Expiration <= DateTime.UtcNow)
            {
                _logger.LogWarning($"Invalid refresh token for user: {username}");
                return null;
            }

            List<Claim> claims = [
                new Claim(ClaimTypes.Name, user.Username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        ];

            var newAccessToken = _tokenService.GenerateAccessToken(principal.Claims);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            tokenInfo.RefreshToken = newRefreshToken;
            tokenInfo.Expiration = DateTime.UtcNow.AddDays(7);
            _unitOfWork.TokenInfoRepository.Update(tokenInfo!);
            _unitOfWork.SaveChanges();

            return new TokenDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpirationTime = tokenInfo.Expiration,
                UserId = user.Id
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while refreshing token.");
            return null;
        }
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
        return "true";
    }

    public bool RevokeToken(string accessToken, string refreshToken)
    {
        var refToken = _unitOfWork.TokenInfoRepository.Query()
        .FirstOrDefault(t => t.RefreshToken == refreshToken);

        if (refToken == null)
        {
            _logger.LogWarning($"Attempted to revoke non-existent refresh token: {refreshToken}");
            return false;
        }

        _unitOfWork.TokenInfoRepository.Delete(refToken);
        _unitOfWork.SaveChanges();

        _logger.LogInformation($"Refresh token revoked successfully (UserId: {refToken.UserId})");
        return true;
    }
}