using Microsoft.Extensions.Logging;

namespace Timesheet.Core.Services.Mail;

public class DummyMailService : IMailService
{
    private readonly ILogger<DummyMailService> _logger;

    public DummyMailService(ILogger<DummyMailService> logger)
    {
        _logger = logger;
    }

    public Task<bool> SendAsync(string to, string subject, string body)
    {
        _logger.LogInformation(@$"Simulating sending email to {to},
        with subject '{subject}',
        and body: {body}");
        return Task.FromResult(true);
    }
}