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

Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

var host = Environment.GetEnvironmentVariable("DB_HOST");
var port = Environment.GetEnvironmentVariable("DB_PORT");
var db = Environment.GetEnvironmentVariable("DB_NAME");
var user = Environment.GetEnvironmentVariable("DB_USER");
var pass = Environment.GetEnvironmentVariable("DB_PASSWORD");

var connectionString = $"Host={host};Port={port};Database={db};Username={user};Password={pass}";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme, JwtBearerDefaults.AuthenticationScheme)
        .Build();
});

builder.Services.AddControllers();
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
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
DbSeeder.SeedData(app);


app.Run();