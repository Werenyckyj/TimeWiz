using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using netDumbster.smtp;
using Timesheet.Core.Services.Mail;

namespace Timesheet.Testing.Integration.Services;

public class MailServiceTests : IDisposable
{
    private const int TestPort = 9000;
    private readonly SimpleSmtpServer _fakeSmtpServer;

    public MailServiceTests()
    {
        Environment.SetEnvironmentVariable("SMTP_HOST", "localhost");
        Environment.SetEnvironmentVariable("SMTP_PORT", TestPort.ToString());
        Environment.SetEnvironmentVariable("SMTP_USER", "testuser@timesheet.local");
        Environment.SetEnvironmentVariable("SMTP_PASSWORD", "testpass");
        _fakeSmtpServer = SimpleSmtpServer.Start(TestPort);
    }

    public void Dispose()
    {
        _fakeSmtpServer.Stop();
        _fakeSmtpServer.Dispose();
        Environment.SetEnvironmentVariable("SMTP_HOST", null);
        Environment.SetEnvironmentVariable("SMTP_PORT", null);
        Environment.SetEnvironmentVariable("SMTP_USER", null);
        Environment.SetEnvironmentVariable("SMTP_PASSWORD", null);
    }

    [Fact]
    public async Task SendAsync_ShouldSuccessfullySendEmailToLocalSmtpServer()
    {
        // Arrange
        var mailService = new MailService();

        var testEmail = "john.doe@timesheet.local";
        var testSubject = "Integration Test Email";
        var testBody = "This is the body of the integration test email!";

        // Act
        var result = await mailService.SendAsync(testEmail, testSubject, testBody);

        // Assert
        Assert.True(result);

        var receivedEmails = _fakeSmtpServer.ReceivedEmail;
        Assert.Single(receivedEmails);

        var email = receivedEmails.First();
        Assert.Contains(testEmail, email.ToAddresses.Select(a => a.Address));
        Assert.Equal(testSubject, email.Headers["Subject"]);
        Assert.Contains(testBody, email.MessageParts[0].BodyData);
    }

    [Fact]
    public async Task SendAsync_ShouldReturnFalse_WhenEmailIsInvalid()
    {
        // Arrange
        var mailService = new MailService();

        // Act
        var result = await mailService.SendAsync("wrong-email", "Test", "Test");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void Constructor_ShouldThrowInvalidOperationException_WhenCredentialsAreMissing()
    {
        // Arrange
        Environment.SetEnvironmentVariable("SMTP_USER", null);
        Environment.SetEnvironmentVariable("SMTP_PASSWORD", null);

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() => new MailService());

        Assert.Contains("SMTP_USER and SMTP_PASSWORD must be set", exception.Message);
    }

    [Fact]
    public async Task SendAsync_ShouldReturnFalse_WhenSmtpServerFailsDuringSend()
    {
        // Arrange
        var mailService = new MailService();
        mailService.Dispose();

        // Act
        var result = await mailService.SendAsync("john.doe@example.com", "Test výpadku", "Tohle neprojde");

        // Assert
        Assert.False(result);
    }
}
