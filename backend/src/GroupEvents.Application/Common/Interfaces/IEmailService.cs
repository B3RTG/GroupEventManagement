namespace GroupEvents.Application.Common.Interfaces;

public interface IEmailService
{
    /// <summary>Sends a transactional email via Resend. Returns true on success.</summary>
    Task<bool> SendAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken ct = default);
}
