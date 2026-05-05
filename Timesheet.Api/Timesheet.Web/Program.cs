using Microsoft.EntityFrameworkCore;
using Timesheet.Core;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Timesheet.Core.Repositories;
using Timesheet.Data;
using DotNetEnv;
using Microsoft.AspNetCore.Authorization;
using Timesheet.Web;
using Timesheet.Core.Services.Auth;
using Microsoft.OpenApi.Models;
using Timesheet.Web.Swagger;
using Timesheet.Core.Services.Mail;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Security.Claims;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (builder.Environment.EnvironmentName != "Testing")
{
    builder.Services.AddDbContext<AppDbContext>(options =>
    {
        options.UseNpgsql(connectionString);
        options.ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
    });
}

builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme, JwtBearerDefaults.AuthenticationScheme)
        .Build();
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.SetIsOriginAllowed(origin => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Timesheet API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Insert your generated JWT token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.OperationFilter<AuthorizeCheckOperationFilter>();
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddAutoMapper(cfg => cfg.AddMaps(typeof(ITRepository<>).Assembly));

builder.Services.AddScoped(typeof(ITRepository<>), typeof(TRepository<>));
builder.Services.AddScoped<UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddScoped<IMailService, DummyMailService>();
}
else
{
    builder.Services.AddScoped<IMailService, MailService>();
}

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? throw new InvalidOperationException("Chybí JWT_SECRET v .env");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER"),
        ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE"),
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

            var userIdClaim = context.Principal!.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = context.Principal.FindFirst(ClaimTypes.Role)?.Value;

            if (int.TryParse(userIdClaim, out int userId))
            {
                var userFromDb = await dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);

                if (userFromDb == null || !userFromDb.IsActive || userFromDb.Role?.Name != roleClaim)
                {
                    context.Fail("Perrmission denied: User is inactive or role has been changed.");
                }
            }
        }
    };
});

var app = builder.Build();

if (app.Environment.EnvironmentName != "Testing")
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Database.Migrate();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(u =>
    {
        u.EnablePersistAuthorization();
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
DbSeeder.SeedData(app);

app.Run();

public partial class Program { }