using System;
using System.Text.RegularExpressions;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Timesheet.Core.Services.Mail;

public partial class MailService : IMailService, IDisposable
{
    private readonly string smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST")!;
    private readonly int smtpPort = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT")!);
    private readonly string smtpUser = Environment.GetEnvironmentVariable("SMTP_USER")!;
    private readonly string smtpPassword = Environment.GetEnvironmentVariable("SMTP_PASSWORD")!;
    private bool isConfigured = false;
    private readonly SmtpClient _smtpClient;
    private readonly ILogger<MailService> _logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger<MailService>();
    [GeneratedRegex(@"^[\w-\.]+@([\w-]+\.)+[\w-]{2,8}$", RegexOptions.Compiled)]
    private static partial Regex EmailRegex();

    public MailService()
    {
        _smtpClient = new SmtpClient();

        if (string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPassword))
        {
            _logger.LogError("SMTP_USER or SMTP_PASSWORD environment variables are not set.");
            throw new InvalidOperationException("SMTP_USER and SMTP_PASSWORD must be set in environment variables.");
        }
    }

    private void ConfigureSmtpClient()
    {
        if (isConfigured) return;

        _smtpClient.Connect(smtpHost, smtpPort, MailKit.Security.SecureSocketOptions.Auto);

        if (_smtpClient.Capabilities.HasFlag(SmtpCapabilities.Authentication))
        {
            _smtpClient.Authenticate(smtpUser, smtpPassword);
        }

        isConfigured = true;
    }

    public void Dispose()
    {
        _smtpClient.Disconnect(true);
        _smtpClient.Dispose();
    }

    public async Task<bool> SendAsync(string to, string subject, string body)
    {
        if (!EmailRegex().IsMatch(to))
        {
            _logger.LogError($"Invalid email address: {to}");
            return false;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Timesheet App", smtpUser));
        message.To.Add(new MailboxAddress(to, to));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = body };

        try
        {
            if (!isConfigured)
            {
                ConfigureSmtpClient();
            }

            await _smtpClient.SendAsync(message);
            _logger.LogInformation($"Email sent to {to}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send email to {to}");
            return false;
        }
    }
}
