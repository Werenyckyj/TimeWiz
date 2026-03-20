using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Timesheet.Data.Models;

namespace Timesheet.Core.Services.Auth;

public class TokenService(IConfiguration config, ILogger<TokenService> logger) : ITokenService
{
    private readonly IConfiguration _config = config;
    private readonly ILogger<TokenService> _logger = logger;
    public string GenerateAccessToken(IEnumerable<Claim> claims)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JWT:Secret"]!));

        var newTokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = _config["JWT:ValidIssuer"],
            Audience = _config["JWT:ValidAudience"],
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddHours(1),
            SigningCredentials = new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        };

        var token = tokenHandler.CreateToken(newTokenDescriptor);
        _logger.LogInformation("Access token generated successfully.");
        return tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        _logger.LogInformation("Refresh token generated successfully.");
        return Convert.ToBase64String(randomNumber);
    }

    public int GetUserIdFromAccessToken(string accessToken)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadJwtToken(accessToken);
        var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        _logger.LogInformation($"User ID extracted from access token: {userIdClaim?.Value}");
        return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
    }

    public ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidAudience = _config["JWT:ValidAudience"],
            ValidIssuer = _config["JWT:ValidIssuer"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JWT:Secret"]!)),
            ValidateLifetime = false,
            ClockSkew = TimeSpan.Zero,
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
        var jwtSecurityToken = securityToken as JwtSecurityToken;
        if (securityToken == null ||
            !jwtSecurityToken!.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            _logger.LogWarning("Invalid token format or signing algorithm.");
            throw new SecurityTokenException("Invalid token");
        }

        _logger.LogInformation("Claims principal extracted from expired token successfully.");
        return principal;
    }
}
