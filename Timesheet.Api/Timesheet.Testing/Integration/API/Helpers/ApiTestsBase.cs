using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Timesheet.Core.Services.Mail;
using Timesheet.Data;
using Xunit;

namespace Timesheet.Testing.Integration.API;

public class ApiTestsBase : IClassFixture<WebApplicationFactory<Program>>
{
    protected readonly HttpClient _client;
    protected readonly WebApplicationFactory<Program> _factory;

    public ApiTestsBase(WebApplicationFactory<Program> factory)
    {
        var sharedDbName = $"IntegrationTestDb_{Guid.NewGuid()}";

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureAppConfiguration((context, config) =>
            {
                var testSettings = new Dictionary<string, string>
                {
                    { "JWT:Secret", "ThisIsMySuperSecretKeyForTests123456789!" },
                    { "JWT:ValidIssuer", "TestIssuer" },
                    { "JWT:ValidAudience", "TestAudience" }
                };
                config.AddInMemoryCollection(testSettings!);
            });

            builder.ConfigureTestServices(services =>
            {
                var mailMock = new Mock<IMailService>();
                mailMock.Setup(m => m.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                        .ReturnsAsync(true);
                services.AddSingleton(mailMock.Object);

                services.AddSingleton<IPolicyEvaluator, FakePolicyEvaluator>();

                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase(sharedDbName);
                });
            });
        });

        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("FakeToken");

        _client = client;
    }
}