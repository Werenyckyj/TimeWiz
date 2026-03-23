using System;

namespace Timesheet.Core.Services.Mail;

public interface IMailService
{
    /// <summary>
    /// Sends an email asynchronously.
    /// </summary>
    /// <param name="to"></param>
    /// <param name="subject"></param>
    /// <param name="body"></param>
    /// <returns></returns>
    public Task<bool> SendAsync(string to, string subject, string body);
}
