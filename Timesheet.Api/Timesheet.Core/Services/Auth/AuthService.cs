using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.Extensions.Logging;
using Timesheet.Data;
using Timesheet.Data.Dtos;
using Timesheet.Data.Dtos.Auth;
using Timesheet.Data.Models;

namespace Timesheet.Core.Services.Auth;

public class AuthService(UnitOfWork unitOfWork, IMapper mapper, ILogger<AuthService> logger, ITokenService tokenService) : IAuthService
{
    private readonly UnitOfWork _unitOfWork = unitOfWork;
    private readonly IMapper _mapper = mapper;
    private readonly ILogger<AuthService> _logger = logger;
    private readonly ITokenService _tokenService = tokenService;
    public LogInRDto? Authenticate(LogInWDto dto)
    {
        try
        {
            var user = _unitOfWork.UserRepository.GetByUsername(dto.Username);
            if (user == null || user.IsActive == false || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                _logger.LogWarning($"Authentication failed for username: {dto.Username}");
                return null;
            }

            List<Claim> claims = [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
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
            _logger.LogError(ex, $"An error occurred during authentication for username: {dto.Username}, Error: {ex.Message}");
            return null;
        }

    }

    public TokenDto? RefreshToken(string accessToken, string refreshToken)
    {
        try
        {
            var principal = _tokenService.GetPrincipalFromExpiredToken(accessToken);
            if (principal == null)
            {
                _logger.LogWarning("Invalid access token provided for refresh.");
                return null;
            }
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
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role!.Name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        ];

            var newAccessToken = _tokenService.GenerateAccessToken(claims);
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

    public UserRDto Register(RegisterWDto dto, out string message)
    {
        var existingUser = _unitOfWork.UserRepository.GetByUsername(dto.Username);
        if (existingUser != null)
        {
            _logger.LogWarning($"User already exists with username: {dto.Username}");
            message = "User already exists.";
            return null!;
        }

        var role = _unitOfWork.RoleRepository.GetById(dto.RoleId);
        if (role == null)
        {
            _logger.LogWarning($"Role not found with ID: {dto.RoleId}");
            message = "Role not found.";
            return null!;
        }

        var company = _unitOfWork.CompanyRepository.GetById(dto.CompanyId);
        if (company == null && dto.RoleId == 4)
        {
            _logger.LogWarning($"Company not found with ID: {dto.CompanyId}");
            message = "Company not found.";
            return null!;
        }

        var newUser = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Name = dto.Name,
            Surname = dto.Surname,
            Email = dto.Email,
            Role = role,
            RoleId = dto.RoleId,
            Company = company,
            CompanyId = dto.CompanyId == 0 ? null : dto.CompanyId,
            TsWeeks = new List<TsWeek>(),
            UserProjects = new List<UserProject>(),
            PasswordResetTokens = new List<PasswordResetToken>(),
            TokenInfos = new List<TokenInfo>()
        };
        var createdUser = _unitOfWork.UserRepository.Add(newUser);
        if (createdUser == null)
        {
            _logger.LogError($"Failed to create user with username: {dto.Username}");
            message = "Failed to create user.";
            return null!;
        }

        _unitOfWork.SaveChanges();
        _logger.LogInformation($"User created successfully with username: {dto.Username}");
        message = "User created successfully.";
        return _mapper.Map<UserRDto>(createdUser.Entity);
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

    public PasswordResetToken ForgotPassword(string email)
    {
        var user = _unitOfWork.UserRepository.Query().FirstOrDefault(u => u.Email == email);
        if (user == null)
        {
            _logger.LogWarning($"Password reset requested for non-existent email: {email}");
            return null!;
        }

        var resetToken = GeneratePasswordResetToken();

        var newToken = new PasswordResetToken
        {
            UserId = user.Id,
            Token = Encoding.UTF8.GetBytes(resetToken),
            Expiration = DateTime.UtcNow.AddHours(1),
            IsUsed = false,
            User = user
        };
        _unitOfWork.PasswordResetTokenRepository.Add(newToken);
        _unitOfWork.SaveChanges();

        _logger.LogInformation($"Password reset token generated for email: {email}");
        return newToken;
    }

    public bool ResetPassword(ResetPasswordDto dto, out string message)
    {
        var user = _unitOfWork.UserRepository.Query().FirstOrDefault(u => u.Email == dto.Email);
        if (user == null)
        {
            message = "User not found.";
            _logger.LogWarning($"Password reset attempted for non-existent email: {dto.Email}");
            return false;
        }

        var tokenBytes = Encoding.UTF8.GetBytes(dto.Token);
        var token = _unitOfWork.PasswordResetTokenRepository.Query()
            .FirstOrDefault(t => t.UserId == user.Id && t.Token.SequenceEqual(tokenBytes) && !t.IsUsed && t.Expiration > DateTime.UtcNow);

        if (token == null)
        {
            message = "Invalid or expired token.";
            _logger.LogWarning($"Invalid or expired password reset token used for email: {dto.Email}");
            return false;
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        token.IsUsed = true;

        _unitOfWork.UserRepository.Update(user);
        _unitOfWork.PasswordResetTokenRepository.Update(token);
        _unitOfWork.SaveChanges();

        message = "Password has been reset successfully.";
        _logger.LogInformation($"Password reset successfully for email: {dto.Email}");
        return true;
    }

    private static string GeneratePasswordResetToken()
    {
        var resetToken = Guid.NewGuid().ToString();
        return resetToken;
    }
}