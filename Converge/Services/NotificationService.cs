// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using Converge.Models;
using Microsoft.Graph;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Azure;
using Azure.Communication.Email;
using System.Text;

namespace Converge.Services
{
  public class NotificationService
  {
    private readonly IConfiguration configuration;
    private readonly AppGraphService appGraphService;
    private readonly TelemetryService telemetryService;

    public NotificationService(IConfiguration configuration,
                               AppGraphService appGraphService,
                               TelemetryService telemetryService)
    {
      this.configuration = configuration;
      this.appGraphService = appGraphService;
      this.telemetryService = telemetryService;
    }

    public async Task TriggerRealTimeNotifications(string userId, DateTime date, Opportunity opportunity)
    {
      User user = await appGraphService.GetUser(userId);
      NotificationPreferences preferences = await appGraphService.GetUserNotificationPreferences(userId);

      if (preferences.Frequency == "Real-Time")
      {
        if (preferences.Teams)
        {
          await SendRealTimeChat(user, date, opportunity);
        }

        if (preferences.Email)
        {
          await SendRealTimeEmailAsync(user, date, opportunity);
        }
      }
    }

    public async Task TriggerScheduledNotifications(string userId, WorkingHours workingHours = null)
    {
      User user = await appGraphService.GetUser(userId);
      NotificationPreferences preferences = await appGraphService.GetUserNotificationPreferences(userId);

      if (preferences.Frequency == null)
      {
        return;
      }

      if (preferences.Frequency == "Daily")
      {
        await HandleDailyNotifications(user, preferences, workingHours);
      }

      if (preferences.Frequency == "Weekly")
      {
        await HandleWeeklyNotifications(user, preferences, workingHours);
      }
    }

    private async Task HandleDailyNotifications(User user, NotificationPreferences preferences, WorkingHours workingHours)
    {
      // This needs to be "now" in the user's timezone
      DateTime date = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, workingHours.TimeZone.Name);
      DateTime preferredTime = new DateTime(date.Year, date.Month, date.Day, 9, 0, 0);
      if (preferences.Time != null)
      {
        DateTime dateTime = DateTime.ParseExact(preferences.Time, "h:mm tt", null);
        int hour = dateTime.Hour;
        int minute = dateTime.Minute;
        preferredTime = new DateTime(date.Year, date.Month, date.Day, hour, minute, 0);
      }

      Calendar calendar = await appGraphService.GetConvergeCalendar(user.Id);
      Event prediction = await appGraphService.GetConvergePrediction(user.Id, calendar.Id, date.Year, date.Month, date.Day);
      List<Opportunity> opportunities = await appGraphService.GetOpportunities(user.Id, calendar.Id, prediction.Id);

      if (preferences.Teams)
      {
        if (opportunities.Any() == true)
        {
           await SendScheduledChat(user, "daily", preferredTime, workingHours);
        }
      }

      if (preferences.Email)
      {
        if (opportunities.Any() == true)
        {
          await SendScheduledEmail(user, "daily", preferredTime, workingHours);
        }
      }
    }

    private async Task HandleWeeklyNotifications(User user, NotificationPreferences preferences, WorkingHours workingHours)
    {
      // This needs to be "now" in the user's timezone
      DateTime date = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, workingHours.TimeZone.Name);
      DateTime preferredTime = new DateTime(date.Year, date.Month, date.Day, 9, 0, 0);
      if (preferences.Time != null)
      {
        DateTime dateTime = DateTime.ParseExact(preferences.Time, "h:mm tt", null);
        int hour = dateTime.Hour;
        int minute = dateTime.Minute;
        preferredTime = new DateTime(date.Year, date.Month, date.Day, hour, minute, 0);
      }

      string today = date.DayOfWeek.ToString();
      List<Opportunity> opportunities = await GetWeekOfOpportunities(user.Id, workingHours);

      if (preferences.Teams)
      {
        if (preferences.Day == today && opportunities.Any() == true)
        {
          await SendScheduledChat(user, "weekly", preferredTime, workingHours);
        }
      }

      if (preferences.Email)
      {
        if (preferences.Day == today && opportunities.Any() == true)
        {
          await SendScheduledEmail(user, "weekly", preferredTime, workingHours);
        }
      }
    }

    private async Task SendScheduledEmail(User recipient, string type, DateTime sendTime, WorkingHours workingHours)
    {
      TimeSpan timeUntilScheduled = sendTime - TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, workingHours.TimeZone.Name);
      await Task.Delay(timeUntilScheduled);
      await SendAzureCommunicationEmail(recipient, type);
    }

    private async Task SendScheduledChat(User recipient, string type, DateTime sendTime, WorkingHours workingHours)
    {
      TimeSpan timeUntilScheduled = sendTime - TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, workingHours.TimeZone.Name);
      await Task.Delay(timeUntilScheduled);
      await TriggerNotificationBot(recipient.Mail, type);
    }


    private async Task SendRealTimeEmailAsync(User recipient, DateTime date, Opportunity opportunity)
    {
      // var message = await GenerateEmailMessage(recipient, "real-time", date, opportunity);
      // await appGraphService.SendEmail(message);
      await SendAzureCommunicationEmail(recipient, "real-time", date, opportunity);
    }

    private async Task SendRealTimeChat(User recipient, DateTime date, Opportunity opportunity)
    {
       await TriggerNotificationBot(recipient.Mail, "real-time", date, opportunity);
    }

    private async Task<Message> GenerateEmailMessage(User recipient, string type, DateTime? date = null, Opportunity opportunity = null)
    {
      string subject = GetNotificationSubject(type, opportunity);
      string content = await GetNotificationContent(recipient, type, date, opportunity);

      var message = new Message
      {
        Subject = subject,
        Body = new ItemBody
        {
          ContentType = BodyType.Html,
          Content = content,
        },
        ToRecipients = new List<Recipient>
              {
                  new Recipient
                  {
                      EmailAddress = new Microsoft.Graph.EmailAddress
                      {
                          Address = recipient.Mail,
                      },
                  },
              },
        From = new Recipient
        {
          EmailAddress = new Microsoft.Graph.EmailAddress
          {
            Address = appGraphService.NotificationEmail,
          },
        }
      };

      return message;

    }

    private string GetNotificationSubject(string type, Opportunity opportunity = null)
    {
      string subject = "";
      switch (type)
      {
        case "real-time":
          subject = $"Opportunity to connect with {opportunity.User.DisplayName}";
          break;

        case "daily":
          subject = "Check today's opportunities to connect!";
          break;

        case "weekly":
          subject = "Check out upcoming opportunities to connect for the next week!";
          break;

        default:
          break;
      }
      return subject;
    }

    private async Task<string> GetNotificationContent(User user, string type, DateTime? date = null, Opportunity opportunity = null)
    {
      string appId = configuration["TeamsAppId"];
      Place place = null;
      var mailContent = "";
      var convergeLink = $@"""https://teams.microsoft.com/_#/apps/{appId}/sections/home""";
      if (opportunity != null){
        place = await appGraphService.GetPlace(opportunity.Location);
      }
      switch (type)
      {
        case "real-time":
          mailContent = $@"
            <html>
              <div>Hi {user.DisplayName},</div><br>
              <div>
                {opportunity.User.DisplayName} will be in the {place.DisplayName} on {date?.ToString("dddd d MMMM")}.
                 Use link below to schedule an in-person meeting in Converge.
              </div><br>
              <a href={convergeLink}' target='_blank'>Go to Converge</a>
            </html>";
          break;

        case "daily":
          mailContent = $@"
            <html>
              <div>Hi {user.DisplayName},</div><br>
              <div>
                 You have opportunities to connect in-person with colleagues today. Use link below to schedule a meeting in Converge.
              </div><br>
              <a href={convergeLink}' target='_blank'>Go to Converge</a>
            </html>";
          break;

        case "weekly":
          mailContent = $@"
            <html>
              <div>Hi {user.DisplayName},</div><br>
              <div>
                 You have opportunities to connect in-person with colleagues next week. Use link below to schedule a meeting in Converge.
              </div><br>
              <a href={convergeLink}' target='_blank'>Go to Converge</a>
            </html>";
          break;

        default:
          break;
      }
      return mailContent;
    }

    private async Task<List<Opportunity>> GetWeekOfOpportunities(string userId, WorkingHours workingHours)
    {
      List<Opportunity> opportunities = new List<Opportunity>();
      List<DateTimeLimit> predictionWindowList = new List<DateTimeLimit>();
      for (int i = 0; i < 7; i++)
      {
        DateTime startDate = DateTime.Today.Date.AddDays(i);
        DateTime endDate = DateTime.Today.Date.AddDays(i + 1);
        DateTimeLimit predictionWindow = new DateTimeLimit(startDate, endDate, workingHours.TimeZone.Name);
        predictionWindowList.Add(predictionWindow);
      }

      var tasks = predictionWindowList.Select(async item => {
        var start = item.Start;
          Calendar calendar = await appGraphService.GetConvergeCalendar(userId);
          if (calendar != null)
          {
            Event prediction = await appGraphService.GetConvergePrediction(userId, calendar.Id, start.Year, start.Month, start.Day);
            if (prediction != null)
            {
              List<Opportunity> opps = await appGraphService.GetOpportunities(userId, calendar.Id, prediction.Id);
              if (opps != null)
              {
                opportunities.AddRange(opps);
              }
            }
          }
      });
      await Task.WhenAll(tasks);
      return opportunities;
    }

    private async Task<string> TriggerNotificationBot(string recipientEmail, string type, DateTime? date = null, Opportunity opportunity = null)
    {
        string domain = configuration["NotificationBotDomain"];
        string appId = configuration["TeamsAppId"];
        var convergeLink = $@"""https://teams.microsoft.com/_#/apps/{appId}/sections/home""";
        HttpClient client = new HttpClient();
        Place place = null;
        if (opportunity != null)
        {
          place = await appGraphService.GetPlace(opportunity.Location);
        }
        var values = new Dictionary<string, string>
        {
          {"recipient", recipientEmail},
          {"type", type},
          {"date", date?.ToString("dddd, dd MMMM yyyy")},
          {"opportunityName", opportunity.User.DisplayName},
          {"location", place.DisplayName},
          {"convergeLink", convergeLink}
        };

        var content = new StringContent(JsonConvert.SerializeObject(values), Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"{domain}/api/notification", content);
        telemetryService.TrackEvent("Send chat post", "response", response);
        var responseString = await response.Content.ReadAsStringAsync();
        return responseString;
    }

    private async Task SendAzureCommunicationEmail(User recipient, string type, DateTime? date = null, Opportunity opportunity = null)
    {
      string connectionString = configuration["AzureCommunicationConnectionString"];
      EmailClient emailClient = new EmailClient(connectionString);

      string subject = GetNotificationSubject(type, opportunity);
      string content = await GetNotificationContent(recipient, type, date, opportunity);

      try
      {
          Console.WriteLine("Sending email...");
          EmailSendOperation emailSendOperation = await emailClient.SendAsync(
              WaitUntil.Completed,
              appGraphService.NotificationEmail,
              recipient.Mail,
              subject,
              content);
          EmailSendResult statusMonitor = emailSendOperation.Value;
          Console.WriteLine($"Email Sent. Status = {emailSendOperation.Value.Status}");

          // Get the OperationId so that it can be used for tracking the message for troubleshooting
          string operationId = emailSendOperation.Id;
          Console.WriteLine($"Email operation id = {operationId}");
      }
      catch (RequestFailedException ex)
      {
          // OperationID is contained in the exception message and can be used for troubleshooting purposes
          Console.WriteLine($"Email send operation failed with error code: {ex.ErrorCode}, message: {ex.Message}");
      }
    }
  }
}