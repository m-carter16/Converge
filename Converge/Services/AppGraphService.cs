// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using Converge.Helpers;
using Converge.Models;
using Converge.Models.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Identity.Client;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace Converge.Services
{
    /// <summary>
    /// Note: Do not add functionality to this service without getting approval for the use of application level permissions.
    /// Instead, use the UserGraphService.
    /// </summary>
    public class AppGraphService
    {
        private readonly ILogger logger;
        private readonly IConfiguration configuration;
        private readonly IConfidentialClientApplication app;
        static readonly List<string> scopesToAccessApplicationGraphApi = new List<string> { "https://graph.microsoft.com/.default" };

        public string ConvergeExtensionId => Constant.ConvergeExtensionId + configuration["AppEnvironment"]?? string.Empty;

        public string ConvergeDisplayName => Constant.Converge + configuration["AppEnvironment"] ?? string.Empty;

        public string ConvergeOpportunitiesId => Constant.Opportunities ?? string.Empty;

        public string NotificationEmail => configuration["NotificationEmail"];

        public string  UserSelectedProperites => "id, displayName, jobTitle, mail, userPrincipalName, onPremisesDistinguishedName,onPremisesExtensionAttributes, assignedLicenses";

        /// <summary>
        /// The empty constructor exists for testing purposes.
        /// </summary>
        public AppGraphService() { }

        public AppGraphService(ILogger<PlacesService> logger, IConfiguration configuration)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.configuration = configuration;

            app = ConfidentialClientApplicationBuilder.Create(configuration["AzureAd:ClientId"])
                .WithClientSecret(configuration["AzureAd:ClientSecret"])
                .WithAuthority(new Uri(configuration["AzureAd:Instance"] + configuration["AzureAd:TenantId"]))
                .Build();
        }

        private GraphServiceClient appGraphServiceClient
        {
            get
            {
                var authResult = app.AcquireTokenForClient(scopesToAccessApplicationGraphApi).ExecuteAsync().GetAwaiter().GetResult();
                return new GraphServiceClient(new DelegateAuthenticationProvider((requestMessage) =>
                {
                    requestMessage
                        .Headers
                        .Authorization = new AuthenticationHeaderValue("bearer", authResult.AccessToken);

                    return Task.FromResult(0);
                }));
            }
        }

        public string ConvergeCalendarEpId
        {
            get { return $"Boolean {{{configuration["AzureAd:TenantId"]}}} Name IsConvergeCalendar{configuration["AppEnvironment"] ?? string.Empty}"; }
        }

        public string ConvergeCalendarEventId
        {
            get { return $"Boolean {{{configuration["AzureAd:TenantId"]}}} Name IsConvergePrediction"; }
        }

        public string ConvergePredictionSetByUser
        {
            get { return $"Boolean {{{configuration["AzureAd:TenantId"]}}} Name IsConvergePredictionSetByUser"; }
        }

        public async Task<ConvergeSettings> GetConvergeSettings(string userId)
        {
            ConvergeSettings convergeSettings = null;
            try
            {
            var extension = await appGraphServiceClient.Users[userId].Extensions[ConvergeExtensionId].Request().GetAsync();
            var json = JsonConvert.SerializeObject(extension.AdditionalData);

            convergeSettings = JsonConvert.DeserializeObject<ConvergeSettings>(json);
            }
            catch
            {
                // do nothing, as we want to return null insstead of the 404 for non-converge users
            }

            return convergeSettings;
        }

        public async IAsyncEnumerable<ConvergeSettings> GetUserExtensionsAsync(List<string> usersUpnList)
        {
            foreach (var userId in usersUpnList)
            {
                ConvergeSettings convergeSettings = null;

                try
                {
                    var extension = await appGraphServiceClient.Users[userId].Extensions[ConvergeExtensionId].Request().GetAsync();
                    var json = JsonConvert.SerializeObject(extension.AdditionalData);

                    convergeSettings = JsonConvert.DeserializeObject<ConvergeSettings>(json);
                }
                catch
                {
                    //do nothing, as we want the loop to continue.
                }

                yield return convergeSettings;
            }
        }

        public async Task<User> GetUser(string upn)
        {
            try
            {
                return await appGraphServiceClient.Users[upn]
                                .Request()
                                .Header("ConsistencyLevel", "eventual")
                                .Select(UserSelectedProperites)
                                .GetAsync();
            }
            catch (ServiceException)
            {
                return null;
            }
        }

        public async Task<LocationPreferences> GetUserLocationPreferences(string userId)
        {
            try
            {
                var extension = await appGraphServiceClient.Users[userId].Extensions[ConvergeExtensionId].Request().GetAsync();
                var json = JsonConvert.SerializeObject(extension.AdditionalData);
                ConvergeSettings convergeSettings = JsonConvert.DeserializeObject<ConvergeSettings>(json);
                return convergeSettings.LocationPreferences;
            } catch
            {
                return null;
            }
        }

        public async Task<NotificationPreferences> GetUserNotificationPreferences(string userId)
        {
            try
            {
                var extension = await appGraphServiceClient.Users[userId].Extensions[ConvergeExtensionId].Request().GetAsync();
                var json = JsonConvert.SerializeObject(extension.AdditionalData);
                ConvergeSettings convergeSettings = JsonConvert.DeserializeObject<ConvergeSettings>(json);
                return convergeSettings.NotificationPreferences;
            } catch
            {
                return null;
            }
        }

        public async Task<List<string>> GetFollowers(string userId)
        {
            try
            {
                var extension = await appGraphServiceClient.Users[userId].Extensions[ConvergeExtensionId].Request().GetAsync();
                var json = JsonConvert.SerializeObject(extension.AdditionalData);
                ConvergeSettings convergeSettings = JsonConvert.DeserializeObject<ConvergeSettings>(json);
                return convergeSettings.MyFollowers;
            } catch
            {
                return null;
            }
        }

       public async Task UpdateFollowers(string userId)
        {
            ConvergeSettings userSettings = await GetConvergeSettings(userId);
            if (userSettings == null) {
                return;
            }
            // Users list is considered his list and his workgroup = teammates
            // TODO: We need to remove users from a users followers when they are unliked or when they are no longer part of the user's team
            List<DirectoryObject> usersList = await GetTeammates(userId);
            bool isNullOrEmpty = usersList?.Any() != true;

            if (isNullOrEmpty)
            {
                return;
            }

            foreach (User user in usersList)
            {
                ConvergeSettings convergeSettings = await GetConvergeSettings(user.Id);
                List<string> followers = new List<string>();
                if (convergeSettings != null)
                {
                    if (convergeSettings.MyFollowers == null)
                    {
                        followers.Add(userId);
                    } else
                    {
                        followers = convergeSettings.MyFollowers;
                        bool inUsersList = followers.Any(userId.Contains);

                        if (!inUsersList)
                        {
                            followers.Append(userId).ToArray();
                        }
                    }
                    convergeSettings.MyFollowers = followers;
                    string json = JsonConvert.SerializeObject(convergeSettings);
                    var extension = new OpenTypeExtension
                    {
                        ExtensionName = ConvergeExtensionId,
                        AdditionalData = JsonConvert.DeserializeObject<Dictionary<string, object>>(json)
                    };
                    await UpdateUserConvergeSettings(user.Id, ConvergeExtensionId, extension);
                }
            }
        }

        public async Task<List<Opportunity>> GetOpportunities(string userId, string calendarId, string eventId)
        {
            try
            {
                var extension = await appGraphServiceClient.Users[userId].Calendars[calendarId].Events[eventId].Extensions[ConvergeOpportunitiesId].Request().GetAsync();
                if (extension != null)
                {
                    var data = extension.AdditionalData["data"] as string;
                    List<Opportunity> opportunities = JsonConvert.DeserializeObject<List<Opportunity>>(data);
                    Console.WriteLine(opportunities);
                    return opportunities;
                }
            }
            catch (ServiceException)
            {
                return null;
            }
            return null;
        }

        public async Task<List<DirectoryObject>> GetUsersList(string userId)
        {
            var extension = await appGraphServiceClient.Users[userId].Extensions[ConvergeExtensionId].Request().GetAsync();
            var json = JsonConvert.SerializeObject(extension.AdditionalData);
            ConvergeSettings convergeSettings = JsonConvert.DeserializeObject<ConvergeSettings>(json);
            List<DirectoryObject> result = new List<DirectoryObject>();
            if (convergeSettings.MyList == null)
            {
                this.logger.LogInformation("Users list is null.");
                return result;
            }
            foreach (string upn in convergeSettings.MyList)
            {
                User user = await appGraphServiceClient.Users[upn]
                                    .Request()
                                    .Header("ConsistencyLevel", "eventual")
                                    .Select(UserSelectedProperites)
                                    .GetAsync();
                if (user != null)
                {
                    bool validUser = ValidConvergeUser(user);
                    if (validUser)
                    {
                        result.Add(user);
                    }
                }
            }
            return result;
        }

         public async Task<List<DirectoryObject>> GetWorkgroup(string userId)
        {
            var result = new List<DirectoryObject>();
            var manager = await appGraphServiceClient.Users[userId].Manager.Request().GetAsync() as User;

            if (manager != null)
            {
                result.Add(manager);
                var colleagues = await appGraphServiceClient.Users[manager.Id].DirectReports.Request().GetAsync();
                result.AddRange(colleagues);
            }
            else
            {
                this.logger.LogInformation("Manager information is null.");
            }

            var reports = await appGraphServiceClient.Users[userId].DirectReports.Request().GetAsync();

            if (reports != null)
            {
                result.AddRange(reports);
            }
            else
            {
                this.logger.LogInformation("Reports are null.");
            }

            return result.Where(u => u.Id != userId).ToList();
        }

        public async Task<List<Opportunity>> FindUsersOpportunities(List<DirectoryObject> teammates, string usersLocation, int year, int month, int day)
        {
            List<Opportunity> opportunities = new List<Opportunity>();
            DateTime date = new DateTime(year, month, day);

            if (teammates == null) {
                return opportunities;
            }

            foreach (DirectoryObject mate in teammates) 
            {
                DirectoryObject user =  await appGraphServiceClient.Users[mate.Id].Request().GetAsync();
                UserLocation matesPrediction = await GetUserLocation(date, mate.Id);
                Opportunity opp = new Opportunity
                {
                    User = user as User,
                    UserId = mate.Id,
                    Location = matesPrediction.Uri,
                    Dismissed = false,
                    SetByUser = false
                };

                if (matesPrediction.Name != "Remote" && matesPrediction.Name == usersLocation)
                {
                opportunities.Add(opp);
                }
            }
            return opportunities;
        }

        public async Task SaveOpportunities(List<Opportunity> opportunities, string userId, string calendarId, string eventId, DataOperationType operationType)
        {
            JArray jsonArray = new JArray();

            foreach (Opportunity opportunity in opportunities)
            {
                JObject jsonObject = JObject.FromObject(opportunity);
                jsonObject.Remove("User");
                JObject userObject = JObject.FromObject(opportunity.User);
                jsonObject.Add("User", userObject);
                jsonArray.Add(jsonObject);
            }

            string json = jsonArray.ToString(Newtonsoft.Json.Formatting.None);
            string cleanJson = json.Replace("\\r\\n", "");

            Dictionary<string, object> additionalData = new Dictionary<string, object>
            {
                { "data", cleanJson }
            };

            var extension = new OpenTypeExtension
            {
                ExtensionName = ConvergeOpportunitiesId,
                AdditionalData = additionalData
            };

            var me = await appGraphServiceClient
                                .Users[userId]
                                .Request()
                                .Select("id")
                                .GetAsync();
            string myUserId = me.Id;

            if (operationType == DataOperationType.IsAdd)
            {
                try
                {
                    await AddUserOpportunities(myUserId, calendarId, eventId, extension);
                }
                catch (ServiceException exception)
                {
                    this.logger.LogError($"Failed adding opportunities.", exception);
                }

            }
            else if (operationType == DataOperationType.IsUpdate)
            {
                 await UpdateUserOpportunities(myUserId, ConvergeOpportunitiesId, calendarId, eventId, extension);
            }
        }

        public async Task AddUserConvergeSettings(string userId, OpenTypeExtension extension) {
            await appGraphServiceClient
                    .Users[userId]
                    .Extensions
                    .Request()
                    .AddAsync(extension);
        }
        public async Task UpdateUserConvergeSettings(string userId, string extensionId, OpenTypeExtension extension) {
            await appGraphServiceClient
                    .Users[userId]
                    .Extensions[extensionId]
                    .Request()
                    .UpdateAsync(extension);
        }

        public async Task AddUserOpportunities(string userId, string calendarId, string eventId, OpenTypeExtension extension) {
            await appGraphServiceClient
                    .Users[userId]
                    .Calendars[calendarId]
                    .Events[eventId]
                    .Extensions
                    .Request()
                    .AddAsync(extension);
        }
        public async Task UpdateUserOpportunities(string userId, string extensionId, string calendarId, string eventId, OpenTypeExtension extension) {
            await appGraphServiceClient
                    .Users[userId]
                    .Calendars[calendarId]
                    .Events[eventId]
                    .Extensions[extensionId]
                    .Request()
                    .UpdateAsync(extension);
        }

        public async Task DeleteExtensions(string userId)
        {
            await appGraphServiceClient.Users[userId].Extensions[ConvergeExtensionId].Request().DeleteAsync();
        }

        public async Task DeleteOpportunities(string userId, string calendarId, string eventId)
        {
            await appGraphServiceClient.Users[userId].Calendars[calendarId].Events[eventId].Extensions[ConvergeOpportunitiesId].Request().DeleteAsync();
        }

        public virtual async Task<List<Event>> GetAllEvents(string upn, string startDateTime, string endDateTime, string filter = "")
        {
            var queryOptions = new List<QueryOption> {
                new QueryOption("startDateTime", startDateTime),
                new QueryOption("endDateTime", endDateTime)
            };

            var events = await appGraphServiceClient.Users[upn]
                .CalendarView
                .Request(queryOptions)
                .Filter(filter)
                .GetAsync();

            List<Event> calendarViewEvents = new List<Event>();
            var pageIterator = PageIterator<Event>
                .CreatePageIterator(
                    appGraphServiceClient,
                    events,
                    (e) =>
                    {
                        calendarViewEvents.Add(e);
                        return true;
                    }
                );

            await pageIterator.IterateAsync();
            return calendarViewEvents;
        }

        /// <summary>
        /// Creates a new list item in SharePoint.
        /// </summary>
        /// <param name="siteId">The ID of the site that owns this item.</param>
        /// <param name="listId">The ID or name of the list that owns this item.</param>
        /// <param name="listItem">The list item to create.</param>
        /// <returns></returns>
        public async Task<ListItem> CreateListItem(string siteId, string listId, ListItem listItem)
        {
            return await appGraphServiceClient.Sites[siteId].Lists[listId].Items.Request().AddAsync(listItem);
        }

        /// <summary>
        /// Updates the fields of an existing list item in SharePoint.
        /// </summary>
        /// <param name="siteId">The ID of the site that owns this item.</param>
        /// <param name="listId">The ID or name of the list that owns this item.</param>
        /// <param name="listItemId">The ID of the item to update.</param>
        /// <param name="fields">The fields that need to be updated.</param>
        /// <returns></returns>
        public async Task UpdateListItemFields(string siteId, string listId, string listItemId, FieldValueSet fields)
        {
            await appGraphServiceClient.Sites[siteId].Lists[listId].Items[listItemId].Fields.Request().UpdateAsync(fields);
        }

        /// <summary>
        /// Returns all the conference rooms in a given room list.
        /// </summary>
        /// <param name="roomListEmailAddress">The email address of the room list (building) that owns these conference rooms.</param>
        /// <returns>A list of conference rooms.</returns>
        public virtual async Task<List<GraphPlace>> GetAllConferenceRooms(string roomListEmailAddress)
        {
            List<GraphPlace> result = new List<GraphPlace>();
            var roomsUrl = appGraphServiceClient.Places.AppendSegmentToRequestUrl($"{roomListEmailAddress}/microsoft.graph.roomlist/rooms");
            var rooms = await new GraphServicePlacesCollectionRequestBuilder(roomsUrl, appGraphServiceClient)
                .Request()
                .GetAsync();

            var pageIterator = PageIterator<Place>
                .CreatePageIterator(
                    appGraphServiceClient,
                    rooms,
                    (ws) =>
                    {
                        result.Add(new GraphPlace(ws, PlaceType.Room, roomListEmailAddress));
                        return true;
                    }
                );

            await pageIterator.IterateAsync();
            return result;
        }

        /// <summary>
        /// Returns all the workspaces in a given room list.
        /// </summary>
        /// <param name="roomListEmailAddress">The email address of the room list (building) that owns these workspaces.</param>
        /// <returns>A list of workspaces.</returns>
        public virtual async Task<List<GraphPlace>> GetAllWorkspaces(string roomListEmailAddress)
        {
            List<GraphPlace> result = new List<GraphPlace>();
            var workspaces = await new GraphServicePlacesCollectionRequestBuilder($"https://graph.microsoft.com/beta/places/{roomListEmailAddress}/microsoft.graph.roomlist/workspaces", appGraphServiceClient)
                .Request()
                .GetAsync();

            var pageIterator = PageIterator<Place>
                .CreatePageIterator(
                    appGraphServiceClient,
                    workspaces,
                    (ws) =>
                    {
                        result.Add(new GraphPlace(ws, PlaceType.Space, roomListEmailAddress));
                        return true;
                    }
                );

            await pageIterator.IterateAsync();
            return result;
        }

        public async Task<ScheduleInformation> GetSchedule(string upn, string start, string end)
        {
            var request = await appGraphServiceClient.Users[upn].Calendar.GetSchedule(
                new List<string> { upn },
                new DateTimeTimeZone
                {
                    DateTime = end,
                    TimeZone = "UTC"
                },
                new DateTimeTimeZone
                {
                    DateTime = start,
                    TimeZone = "UTC"
                }
            )
                .Request()
                .PostAsync();
            List<ScheduleInformation> schedules = request.CurrentPage as List<ScheduleInformation>;
            return schedules[0];
        }

        public async Task<ListItem> GetAdminSettings()
        {
            string itemTitle = ConvergeExtensionId;
            string sharePointSiteId = configuration["SharePointSiteId"];
            string sharePointAdminListId = configuration["SharePointAdminListId"];
            try
            {
                var request = await appGraphServiceClient.Sites[sharePointSiteId].Lists[sharePointAdminListId].Items
                .Request()
                .Expand("fields")
                .Filter($"fields/Title eq '{itemTitle}'")
                .GetAsync();
                return request[0];
            }
            catch
            {
                var requestBody = new ListItem
                {
                    Fields = new FieldValueSet
                    {
                        AdditionalData = new Dictionary<string, object>
                        {
                            {
                                "Title" , itemTitle
                            }
                        }
                    }
                };
                var newItemResult = await CreateListItem(sharePointSiteId, sharePointAdminListId, requestBody);
                return newItemResult;
            }
        }

        public async Task<AdminSettings> SetAdminSettings(AdminSettings adminSettings)
        {
            string itemTitle = ConvergeExtensionId;
            string sharePointSiteId = configuration["SharePointSiteId"];
            string sharePointAdminListId = configuration["SharePointAdminListId"];
            ListItem listItem = await GetAdminSettings();
            var fields = new FieldValueSet
            {
                AdditionalData = new Dictionary<string, object>
                {
                    {
                        "Title", itemTitle
                    },
                    {
                        "WorkSpaceEnabled", adminSettings.WorkspaceEnabled
                    },
                    {
                        "AppBannerMessage", adminSettings.AppBannerMessage
                    },
                    {
                        "AppBannerType", adminSettings.AppBannerType
                    },
                    {
                        "AppBannerExpiration", adminSettings.AppBannerExpiration
                    },
                }
            };

            if (listItem.Id != null)
            {
                try
                {
                    await UpdateListItemFields(sharePointSiteId, sharePointAdminListId, listItem.Id, fields);
                    return adminSettings;
                } catch (Exception)
                {
                    return null;
                }
            } else
            {
                try
                {
                    await CreateListItem(sharePointSiteId, sharePointAdminListId, listItem);
                    return adminSettings;
                } catch (Exception)
                {
                    return null;
                }
            }
        }

        public async Task<List<ListItem>> GetPhotoItems(string siteId, string listId, string roomLookupId)
        {
            var request = await appGraphServiceClient.Sites[siteId].Lists[listId].Items
                .Request()  
                .Expand("fields")
                .Filter($"fields/RoomLookupId eq '{roomLookupId}'")
                .GetAsync();
            List<ListItem> listItems = request.CurrentPage as List<ListItem>;
            return listItems;
        }

        public async Task<string> GetPhotoUrl(string siteId, string listId, string itemId)
        {
            var request = await appGraphServiceClient.Sites[siteId].Lists[listId].Items[itemId].DriveItem.Thumbnails.Request().GetAsync();
            List<ThumbnailSet> thumbnails = request.CurrentPage as List<ThumbnailSet>;
            string url = string.Empty;
            Parallel.ForEach(thumbnails, thumbnail =>
            {
                url = thumbnail.Large.Url;
            });
            return url;
        }

        public async Task<List<User>> GetConvergeUsers()
        {
            IGraphServiceUsersCollectionPage graphUsers = await appGraphServiceClient.Users
                .Request()
                .Expand("extensions")
                .Select("extensions")
                .Top(999)
                .GetAsync();

            List<User> convergeUsers = new List<User>();
            var pageIterator = PageIterator<User>
                .CreatePageIterator(
                    appGraphServiceClient,
                    graphUsers,
                    (u) =>
                    {
                        if (u.Extensions != null)
                        {
                            ConvergeSettings convergeSettings = null;
                            var targetExtension = u.Extensions.FirstOrDefault(y => y.Id.SameAs(ConvergeExtensionId));
                            if (targetExtension != null)
                            {
                                var json = JsonConvert.SerializeObject(targetExtension.AdditionalData);
                                convergeSettings = JsonConvert.DeserializeObject<ConvergeSettings>(json);
                            }

                            if (convergeSettings != null && convergeSettings.IsConvergeUser == true)
                            {
                                convergeUsers.Add(u);
                            }
                        }
                        return true;
                    });

            await pageIterator.IterateAsync();
            return convergeUsers;
        }

        public async Task<bool> IsConvergeInstalled(string upn)
        {
            var request = await appGraphServiceClient.Users[upn].Teamwork.InstalledApps.Request().Expand("teamsAppDefinition").GetAsync();
            var installedApps = request.CurrentPage as List<UserScopeTeamsAppInstallation>;
            foreach (UserScopeTeamsAppInstallation app in installedApps)
            {
                if (app.TeamsAppDefinition.DisplayName.SameAs(ConvergeDisplayName))
                {
                    return true;
                }
            }
            return false;
        }

        public async Task UpdateEvent(string upn, Event prediction)
        {
            await appGraphServiceClient.Users[upn].Events[prediction.Id].Request().UpdateAsync(prediction);
        }

        public async Task DeleteEvent(string upn, string id)
        {
            await appGraphServiceClient.Users[upn].Events[id].Request().DeleteAsync();
        }

        public async Task<Calendar> GetConvergeCalendar(string upn)
        {
            try
            {
                var calendarRequest = await appGraphServiceClient.Users[upn].Calendars.Request().Expand($"singleValueExtendedProperties($filter=id eq '{ConvergeCalendarEpId}')").GetAsync();
                List<Calendar> calendars = calendarRequest.CurrentPage as List<Calendar>;
                return calendars.Find(c => c.SingleValueExtendedProperties != null && c.SingleValueExtendedProperties.Any(ep => ep.Id == ConvergeCalendarEpId));
            } catch
            {
                return null;
            }
        }

        public async Task DeleteConvergeCalendar(string upn)
        {
            var calendar = await GetConvergeCalendar(upn);
            if (calendar != null)
            {
                await appGraphServiceClient.Users[upn].Calendars[calendar.Id].Request().DeleteAsync();
            }
        }

        public async Task CreateConvergePrediction(string id, string calendarId, Event newEvent, bool isPredictionUserSet = false)
        {
            newEvent.SingleValueExtendedProperties = new EventSingleValueExtendedPropertiesCollectionPage
            {
                new SingleValueLegacyExtendedProperty
                {
                    Id = ConvergeCalendarEventId,
                    Value = "true",
                },
                new SingleValueLegacyExtendedProperty
                {
                    Id = ConvergePredictionSetByUser,
                    Value = isPredictionUserSet ? "true" : "false",
                }
            };
            await appGraphServiceClient.Users[id].Calendars[calendarId].Events.Request().AddAsync(newEvent);
        }

        public async Task<bool> CheckOutOfOffice(string id, int year, int month, int day)
        {
            DateTime startDateTime = new DateTime(year, month, day);
            string start = startDateTime.ToString("O");
            string end = startDateTime.AddDays(1).ToString("O");

            var queryOptions = new List<QueryOption>()
            {
                new QueryOption("startDateTime", start),
                new QueryOption("endDateTime", end)
            };

            var calendar = await appGraphServiceClient.Users[id].CalendarView.Request(queryOptions).GetAsync();
            var eventsOutOfOffice = calendar.CurrentPage.Where(x => x.ShowAs == FreeBusyStatus.Oof);
            if (eventsOutOfOffice != null && eventsOutOfOffice.Count() > 0)
            {
                return true;
            } else
            {
                return false;
            }
        }

        public async Task<Event> GetConvergePrediction(string id, string calendarId, int year, int month, int day)
        {
            DateTime startDateTime = new DateTime(year, month, day);
            string start = startDateTime.ToString("O");
            string end = startDateTime.AddDays(1).ToString("O");
            try
            {
                var eventRequest = await appGraphServiceClient.Users[id].Calendars[calendarId].Events.Request()
                                        .Filter($"end/dateTime le '{end}' and start/dateTime ge '{start}'")
                                        .Expand($"singleValueExtendedProperties($filter=id eq '{ConvergeCalendarEventId}' or id eq '{ConvergePredictionSetByUser}')")
                                        .GetAsync();

            List<Event> events = eventRequest.CurrentPage as List<Event>;
            return events?.Find(e => e.SingleValueExtendedProperties?.Any(svep => svep.Id == ConvergeCalendarEventId) ?? false);
            } catch
            {
                return null;
            }
        }

        public async Task<WorkingHours> GetWorkingHours(string upn)
        {
            string mailboxSettingsUrl = appGraphServiceClient.Users[upn].AppendSegmentToRequestUrl("mailboxSettings/workingHours");
            var workingHoursRequest = await new UserSettingsRequestBuilder(mailboxSettingsUrl, appGraphServiceClient).Request().GetAsync();
            var jsonWorkingHours = JsonConvert.SerializeObject(workingHoursRequest.AdditionalData);
            WorkingHours workingHours = JsonConvert.DeserializeObject<WorkingHours>(jsonWorkingHours);
            if (workingHours.StartTime == null || workingHours.EndTime == null)
            {
                workingHours = new WorkingHours
                {
                    EndTime = new TimeOfDay(17, 0, 0),
                    StartTime = new TimeOfDay(8, 0, 0),
                    TimeZone = new TimeZoneBase { Name = Constant.TimeZonePST },
                };
            }
            else
            {
                workingHours = new WorkingHours
                {
                    EndTime = workingHours.EndTime,
                    StartTime = workingHours.StartTime,
                    TimeZone = workingHours.TimeZone,
                };
            }
            return workingHours;
        }

        public async Task<List> GetList(string siteId, string listId)
        {
            try
            {
                return await appGraphServiceClient.Sites[siteId].Lists[listId].Request().Expand("columns").GetAsync();
            }
            catch (ServiceException)
            {
                return null;
            }
        }

        public async Task<List<ListItem>> GetListItems(string siteId, string listId)
        {
            try
            {
                var listItemRequest = await appGraphServiceClient.Sites[siteId].Lists[listId].Items.Request().Expand("fields").GetAsync();

                List<ListItem> result = new List<ListItem>();

                var pageIterator = PageIterator<ListItem>
                  .CreatePageIterator(
                      appGraphServiceClient,
                      listItemRequest,
                      (item) =>
                      {
                          result.Add(item);
                          return true;
                      }
                  );

                await pageIterator.IterateAsync();
                return result;
            }
            catch (ServiceException)
            {
                return null;
            }
        }

        public async Task<List<DirectoryObject>> GetTeammates(string userId)
        {
            List<DirectoryObject> teammates = new List<DirectoryObject>();
            List<DirectoryObject> mylist = await GetUsersList(userId);
            List<DirectoryObject> workgroup = await GetWorkgroup(userId);

            teammates.AddRange(mylist);
            teammates.AddRange(workgroup);
            teammates.Distinct().ToList();

            return teammates;
        }

        public virtual async Task<List<Place>> GetAllRoomLists()
        {
            var url = appGraphServiceClient.Places.AppendSegmentToRequestUrl("microsoft.graph.roomList");
            var roomLists = await new GraphServicePlacesCollectionRequestBuilder(url, appGraphServiceClient)
                .Request()
                .GetAsync();

            List<Place> result = new List<Place>();

            var pageIterator = PageIterator<Place>
                .CreatePageIterator(
                    appGraphServiceClient,
                    roomLists,
                    (room) =>
                    {
                        result.Add(room);
                        return true;
                    }
                );

            await pageIterator.IterateAsync();
            return result;
        }

        public async Task<List<Place>> GetRoomListsByDisplayName(List<string> roomListsDisplayNames)
        {
            StringBuilder predicateBuilder = new StringBuilder();
            for (int index = 0; index < roomListsDisplayNames.Count; ++index)
            {
                predicateBuilder.Append($"displayName eq '{roomListsDisplayNames[index]}'");
                if (index + 1 < roomListsDisplayNames.Count)
                {
                    predicateBuilder.Append(" or ");
                }
            }

            var placesUrl = appGraphServiceClient.Places.AppendSegmentToRequestUrl("microsoft.graph.roomList");
            var placesCollPage = await new GraphServicePlacesCollectionRequestBuilder(placesUrl, appGraphServiceClient)
                                                                        .Request()
                                                                        .Filter(predicateBuilder.ToString())
                                                                        .OrderBy("displayName")
                                                                        .GetAsync();

            List<Place> placesList = placesCollPage.CurrentPage as List<Place>;
            return placesList;
        }

        public async Task<Place> GetRoomListById(string roomListIdentity)
        {
            List<Place> places = await GetRoomListsCollectionByIds(new List<string> { roomListIdentity });
            return (places == null || places.Count == 0) ? null : places[0];
        }

        public async Task<List<Place>> GetRoomListsCollectionByIds(List<string> roomListsIdentities)
        {
            var placesUrl = appGraphServiceClient.Places.AppendSegmentToRequestUrl("microsoft.graph.roomList");

            StringBuilder predicateBuilder = new StringBuilder();
            for (int index = 0; index < roomListsIdentities.Count; ++index)
            {
                predicateBuilder.Append($"emailAddress eq '{roomListsIdentities[index]}'");
                if (index + 1 < roomListsIdentities.Count)
                {
                    predicateBuilder.Append(" or ");
                }
            }

            var places = await new GraphServicePlacesCollectionRequestBuilder(placesUrl, appGraphServiceClient)
                                                                    .Request()
                                                                    .Filter(predicateBuilder.ToString())
                                                                    .GetAsync();

            return (places == null || places.Count == 0) ? null : places.CurrentPage as List<Place>;
        }

        public async Task<GraphListItemsResponse> GetListItemsByGPSRange(GPSCoordinates[] gpsCoordinatesRange, PlaceType? placeType)
        {
            string siteId = configuration["SharePointSiteId"];
            string listId = configuration["SharePointListId"];
            List placesList = await GetList(siteId, listId);
            if (placesList == null)
            {
                this.logger.LogError($"Places list is empty for SharePoint-Site-id and SharePoint-List-id.");
                return null;
            }

            StringBuilder predicateBuilder = new StringBuilder($"(fields/EmailAddress ne '')");
            predicateBuilder.Append($" and (fields/IsAvailable eq 1)");
            predicateBuilder.Append($" and (fields/BookingType ne '{BookingType.Reserved}')");
            if (placeType.HasValue)
            {
                predicateBuilder.Append($" and (fields/PlaceType eq '{Enum.GetName(typeof(PlaceType), placeType.Value)}')");
            }

            if (gpsCoordinatesRange != null && gpsCoordinatesRange.Length == 2)
            {
                predicateBuilder.Append($" and (fields/Latitude ge {gpsCoordinatesRange[0].Latitude} and fields/Longitude ge {gpsCoordinatesRange[0].Longitude}");
                predicateBuilder.Append($" and fields/Latitude le {gpsCoordinatesRange[1].Latitude} and fields/Longitude le {gpsCoordinatesRange[1].Longitude})");
            }

            IListItemsCollectionRequest listItemsCollRequest = BuildListItemsCollectionRequest(siteId, placesList.Id, predicateBuilder.ToString());

            try
            {
                var listItemsRequest = await listItemsCollRequest.GetAsync();

                var listItems = listItemsRequest.CurrentPage as List<ListItem>;
                var skipToken = listItemsRequest.NextPageRequest?.QueryOptions.FirstOrDefault(x => x.Name.SameAs("$skiptoken"));

                return new GraphListItemsResponse(listItems, skipToken);
            }
            catch
            {
                return null;
            }
        }

        public async Task<GraphListItemsResponse> GetListItemsByRoomListIds(
            List<string> roomListsIdentifiers, 
            PlaceType? placeType = null, 
            int? topCount = null,
            QueryOption skipToken = null,
            ListItemFilterOptions listItemFilterOptions = null
        )
        {
            string siteId = configuration["SharePointSiteId"];
            string listId = configuration["SharePointListId"];
            List placesList = await GetList(siteId, listId);
            if (placesList == null)
            {
                this.logger.LogError($"Places list is empty for SharePoint-Site-id and SharePoint-List-id.");
                return null;
            }

            StringBuilder predicateBuilder = new StringBuilder($"(fields/EmailAddress ne '')");
            predicateBuilder.Append($" and (fields/IsAvailable eq 1)");
            if (roomListsIdentifiers != null && roomListsIdentifiers.Count > 0)
            {
                predicateBuilder.Append(" and (");
                for (int index = 0; index < roomListsIdentifiers.Count; ++index)
                {
                    predicateBuilder.Append($"fields/Locality eq '{roomListsIdentifiers[index]}'");
                    if (index + 1 < roomListsIdentifiers.Count)
                    {
                        predicateBuilder.Append(" or ");
                    }
                }
                predicateBuilder.Append(")");
            }
            predicateBuilder.Append($" and (fields/BookingType ne '{BookingType.Reserved}')");
            if (placeType.HasValue)
            {
                predicateBuilder.Append($" and (fields/PlaceType eq '{Enum.GetName(typeof(PlaceType), placeType.Value)}')");
            }

            if (listItemFilterOptions != null)
            {
                if (listItemFilterOptions.IsWheelChairAccessible)
                {
                    predicateBuilder.Append(" and (fields/IsWheelChairAccessible eq 1)");
                }

                if (listItemFilterOptions.HasVideo)
                {
                    predicateBuilder.Append(" and (fields/VideoDeviceName ne null)");
                }

                if (listItemFilterOptions.HasAudio)
                {
                    predicateBuilder.Append(" and (fields/AudioDeviceName ne null)");
                }

                if (listItemFilterOptions.HasDisplay)
                {
                    predicateBuilder.Append(" and (fields/DisplayDeviceName ne null)");
                }

                if (!string.IsNullOrEmpty(listItemFilterOptions?.DisplayNameSearchString))
                {
                    predicateBuilder.Append($" and startsWith(fields/Name,'{listItemFilterOptions.DisplayNameSearchString}')");
                }

                if (listItemFilterOptions?.Capacity == 3) {
                    predicateBuilder.Append(" and (fields/Capacity) ge 10 ");
                }

                if (listItemFilterOptions?.Capacity == 2) {
                    predicateBuilder.Append(" and (fields/Capacity) ge 5 and (fields/Capacity) lt 10");
                }

                if (listItemFilterOptions?.Capacity == 1) {
                    predicateBuilder.Append(" and (fields/Capacity) ge 1 and (fields/Capacity) le 4");
                }

                // Always exclude rooms with 0 capacity
                if (listItemFilterOptions?.Capacity == null) {
                    predicateBuilder.Append(" and (fields/Capacity) ge 1");
                }
            }

            IListItemsCollectionRequest listItemsCollRequest = BuildListItemsCollectionRequest(siteId, placesList.Id, predicateBuilder.ToString(), topCount, skipToken);
            listItemsCollRequest.OrderBy("fields/Capacity desc");
            try
            {
                var listItemsRequest = await listItemsCollRequest.GetAsync();

                var listItems = listItemsRequest.CurrentPage as List<ListItem>;
                skipToken = listItemsRequest.NextPageRequest?.QueryOptions.FirstOrDefault(x => x.Name.SameAs("$skiptoken"));

                return new GraphListItemsResponse(listItems, skipToken);
            }
            catch (Exception e)
            {
                this.logger.LogError("Error retrieving list items: ", e);
                return null;
            }
        }

        private IListItemsCollectionRequest BuildListItemsCollectionRequest(string siteId, string placesListId, string predicate, int? topCount = null, QueryOption skipToken = null)
        {
            IListItemsCollectionRequest listItemsCollRequest;
            var listItemsCollRequestBuilder = appGraphServiceClient.Sites[siteId].Lists[placesListId].Items;
            if (skipToken == null)
            {
                listItemsCollRequest = listItemsCollRequestBuilder.Request();
            }
            else
            {
                listItemsCollRequest = listItemsCollRequestBuilder.Request(new List<QueryOption> { skipToken });
            }
            listItemsCollRequest = listItemsCollRequest.Expand("fields").Filter(predicate);
            if (topCount.HasValue)
            {
                listItemsCollRequest = listItemsCollRequest.Top(topCount.Value);
            }

            return listItemsCollRequest;
        }

        public async Task<GraphListItemsResponse> GetListItemsByPlaceUpns(List<string> placesUpnsList, PlaceType? placeType, int? topCount = null, QueryOption skipToken = null)
        {
            string siteId = configuration["SharePointSiteId"];
            string listId = configuration["SharePointListId"];
            List placesList = await GetList(siteId, listId);
            if (placesList == null)
            {
                this.logger.LogError($"Places list is empty for SharePoint-Site-id and SharePoint-List-id.");
                return null;
            }

            StringBuilder predicateBuilder = new StringBuilder($"(fields/IsAvailable eq 1)");
            if (placesUpnsList != null && placesUpnsList.Count > 0)
            {
                predicateBuilder.Append(" and (");
                for (int index = 0; index < placesUpnsList.Count; ++index)
                {
                    predicateBuilder.Append($"fields/EmailAddress eq '{placesUpnsList[index]}'");
                    if (index + 1 < placesUpnsList.Count)
                    {
                        predicateBuilder.Append(" or ");
                    }
                }
                predicateBuilder.Append(")");
            }
            if (placeType.HasValue)
            {
                predicateBuilder.Append($" and (fields/PlaceType eq '{Enum.GetName(typeof(PlaceType), placeType.Value)}')");
            }

            IListItemsCollectionRequest listItemsCollRequest = BuildListItemsCollectionRequest(siteId, placesList.Id, predicateBuilder.ToString(), topCount, skipToken);
            try
            {
                var listItemsRequest = await listItemsCollRequest.GetAsync();

                var listItems = listItemsRequest.CurrentPage as List<ListItem>;
                skipToken = listItemsRequest.NextPageRequest?.QueryOptions.FirstOrDefault(x => x.Name.SameAs("$skiptoken"));

                return new GraphListItemsResponse(listItems, skipToken);
            }
            catch (Exception e)
            {
                this.logger.LogError("Error retrieving list items: ", e);
                return null;
            }
        }

        public async Task<GraphListItemsResponse> GetListItemsByPlaceType(PlaceType? placeType, int? topCount = null, QueryOption skipToken = null)
        {
            string siteId = configuration["SharePointSiteId"];
            string listId = configuration["SharePointListId"];
            List placesList = await GetList(siteId, listId);
            if (placesList == null)
            {
                this.logger.LogError($"Places list is empty for SharePoint-Site-id and SharePoint-List-id.");
                return null;
            }

            StringBuilder predicateBuilder = new StringBuilder($"(fields/IsAvailable eq 1)");
            predicateBuilder.Append($" and (fields/BookingType ne '{BookingType.Reserved}')");
            if (placeType.HasValue)
            {
                predicateBuilder.Append($" and (fields/PlaceType eq '{Enum.GetName(typeof(PlaceType), placeType.Value)}')");
            }

            IListItemsCollectionRequest listItemsCollRequest = BuildListItemsCollectionRequest(siteId, placesList.Id, predicateBuilder.ToString(), topCount, skipToken);
            try
            {
                var listItemsRequest = await listItemsCollRequest.GetAsync();

                var listItems = listItemsRequest.CurrentPage as List<ListItem>;
                skipToken = listItemsRequest.NextPageRequest?.QueryOptions.FirstOrDefault(x => x.Name.SameAs("$skiptoken"));

                return new GraphListItemsResponse(listItems, skipToken);
            }
            catch
            {
                return null;
            }
        }
        public async Task<bool> IsConvergeAdmin(string userId)
        {
            string groupId = configuration["M365AdminGroup"];
            try
            {
                var memberOf = await appGraphServiceClient.Users[userId].MemberOf[groupId]
                .Request()
                .GetAsync();
                if (memberOf != null)
                {
                    return true;
                }
            } catch
            {
                return false;
            }
            return false;
        }

        public bool ValidConvergeUser (User user)
        {
             bool distinguished = false;
             bool extension = false;  
             bool isLicensed = false;

            if (user.OnPremisesDistinguishedName != null)
            {
                distinguished = user.OnPremisesDistinguishedName.Contains("OU=Admin");
            }
            if (user.OnPremisesExtensionAttributes != null)
            {
                if (user.OnPremisesExtensionAttributes.ExtensionAttribute1 != null)
                {
                    extension = user.OnPremisesExtensionAttributes.ExtensionAttribute1.EndsWith("A");
                }
            }
            var licenses = user.AssignedLicenses.ToArray();
            if (licenses != null && licenses.Length > 0)
            {
                isLicensed = true;
            }

            bool validConvergeUser =  distinguished == false && extension == false && isLicensed == true;
            return validConvergeUser;
        }

        /// <summary>
        /// Gets the users default location.
        /// </summary>
        /// <param name="date">Date in question</param>
        /// <param name="locationPreference">Users location preferences from their converge settings.</param>
        /// <returns>Default location.</returns>
        public string GetDefaultLocation(DateTime date, LocationPreferences locationPreference)
        {
            string defaultLocation = null;
            if (locationPreference == null) {
                return defaultLocation;
            }
            var dayOfWeek = date.DayOfWeek.ToString();
            var prop = typeof(LocationPreferences).GetProperty(dayOfWeek);
            if (prop != null)
            {
              defaultLocation = prop.GetValue(locationPreference) as string;
            }
            return defaultLocation;
        }

        /// <summary>
        /// Gets the users predicted location.
        /// </summary>
        /// <param name="date">Date in question</param>
        /// <param name="userId">Id of the user.</param>
        /// <returns>UserLocation</returns>
        public async Task<UserLocation> GetUserLocation(DateTime date, string userId)
        {
            LocationPreferences locationPreference = await GetUserLocationPreferences(userId);
            UserLocation userLocation = new UserLocation
            {
                Name = "Remote",
                Uri = "",
                Date = date,
            };

            Calendar calendar = await GetConvergeCalendar(userId);
            if (calendar == null){
                return new UserLocation
                {
                    Name = "Unknown",
                    Uri = "",
                    Date = date,
                };
            }
            if (calendar != null)
            {
                Event prediction = await GetConvergePrediction(userId, calendar.Id, date.Year, date.Month, date.Day);
                if (prediction != null)
                {
                    userLocation.DefaultLocation = locationPreference?.DefaultLocation ?? "";
                    userLocation.DefaultBuilding = locationPreference?.DefaultBuilding ?? "";
                    userLocation.Name = prediction.Location?.DisplayName ?? "Remote";
                    userLocation.Uri = prediction.Location?.LocationUri ?? "";
                    return userLocation;
                }
            }

            string defaultLocation = GetDefaultLocation(date, locationPreference);
            if (defaultLocation == "In-office")
            {
                if (locationPreference.DefaultBuilding != null)
                {
                    Place building = await GetPlace(locationPreference.DefaultBuilding);
                    userLocation.DefaultLocation = locationPreference?.DefaultLocation ?? "";
                    userLocation.DefaultBuilding = locationPreference?.DefaultBuilding ?? "";
                    userLocation.Name = building.DisplayName;
                    userLocation.Uri = locationPreference.DefaultBuilding;
                    return userLocation;
                }
                return userLocation;
            }

            if (defaultLocation == "Scheduled-off")
            {
                userLocation.DefaultLocation = locationPreference?.DefaultLocation ?? "";
                userLocation.DefaultBuilding = locationPreference?.DefaultBuilding ?? "";
                userLocation.Name = "Scheduled-off";
                userLocation.Uri = "";
                return userLocation;
            }

            bool NonConvergeCalendarOutOfOffice = await CheckOutOfOffice(userId, date.Year, date.Month, date.Day);
            if (NonConvergeCalendarOutOfOffice)
            {
                userLocation.DefaultLocation = locationPreference?.DefaultLocation ?? "";
                userLocation.DefaultBuilding = locationPreference?.DefaultBuilding ?? "";
                userLocation.Name = "Out of Office";
                userLocation.Uri = "";
                return userLocation;
            }

            if (defaultLocation == null)
            {
                return userLocation;
            }
            return userLocation;
        }

        public async Task SendEmail(Message message)
        {
            await appGraphServiceClient.Users[NotificationEmail].SendMail(message, true).Request().PostAsync();
        }

        public async Task<Place> GetPlace(string upn)
        {
            return await appGraphServiceClient.Places[upn].Request().GetAsync();
        }
    }
}
