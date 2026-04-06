using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Infrastructure.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GroupEvents.Infrastructure.Notifications;

/// <summary>
/// Sends transactional emails via Resend REST API.
/// https://resend.com/docs/api-reference/emails/send-email
/// </summary>
public class ResendEmailService : IEmailService
{
    private const string ResendEndpoint = "https://api.resend.com/emails";

    private readonly HttpClient _http;
    private readonly ResendSettings _settings;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(
        HttpClient http,
        IOptions<ResendSettings> settings,
        ILogger<ResendEmailService> logger)
    {
        _http = http;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<bool> SendAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            _logger.LogWarning("Resend API key not configured. Email to {To} skipped.", to);
            return false;
        }

        try
        {
            var payload = new
            {
                from = _settings.From,
                to = new[] { to },
                subject,
                html = htmlBody
            };

            var json = JsonSerializer.Serialize(payload);
            var request = new HttpRequestMessage(HttpMethod.Post, ResendEndpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);

            var response = await _http.SendAsync(request, ct);

            if (response.IsSuccessStatusCode) return true;

            var body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Resend send failed. Status={Status} Body={Body}", response.StatusCode, body);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Resend send threw an exception for {To}", to);
            return false;
        }
    }
}
