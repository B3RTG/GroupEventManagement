using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Google.Apis.Auth.OAuth2;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Infrastructure.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GroupEvents.Infrastructure.Notifications;

/// <summary>
/// Sends push notifications via FCM HTTP v1 API using a service account credential.
/// https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send
/// </summary>
public class FcmPushNotificationService : IPushNotificationService
{
    private const string FcmScope = "https://www.googleapis.com/auth/firebase.messaging";

    private readonly HttpClient _http;
    private readonly FcmSettings _settings;
    private readonly ILogger<FcmPushNotificationService> _logger;

    public FcmPushNotificationService(
        HttpClient http,
        IOptions<FcmSettings> settings,
        ILogger<FcmPushNotificationService> logger)
    {
        _http = http;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<PushSendResult> SendAsync(
        string pushToken,
        string title,
        string body,
        Dictionary<string, string>? data = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ServiceAccountJson))
        {
            _logger.LogWarning("FCM service account not configured. Push notification skipped.");
            return new PushSendResult(false, false);
        }

        try
        {
            var accessToken = await GetAccessTokenAsync(ct);

            var payload = new
            {
                message = new
                {
                    token = pushToken,
                    notification = new { title, body },
                    data = data ?? new Dictionary<string, string>()
                }
            };

            var json = JsonSerializer.Serialize(payload);
            var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"https://fcm.googleapis.com/v1/projects/{_settings.ProjectId}/messages:send")
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _http.SendAsync(request, ct);

            if (response.IsSuccessStatusCode) return new PushSendResult(true, false);

            var responseBody = await response.Content.ReadAsStringAsync(ct);
            var tokenUnregistered = responseBody.Contains("UNREGISTERED", StringComparison.OrdinalIgnoreCase);

            _logger.LogWarning(
                "FCM send failed. Status={Status} Unregistered={Unregistered} Body={Body}",
                response.StatusCode, tokenUnregistered, responseBody);

            return new PushSendResult(false, tokenUnregistered);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FCM send threw an exception for token {Token}", pushToken[..Math.Min(8, pushToken.Length)]);
            return new PushSendResult(false, false);
        }
    }

    private async Task<string> GetAccessTokenAsync(CancellationToken ct)
    {
        var credential = GoogleCredential
            .FromJson(_settings.ServiceAccountJson)
            .CreateScoped(FcmScope);

        return await credential.UnderlyingCredential.GetAccessTokenForRequestAsync(
            cancellationToken: ct);
    }
}
