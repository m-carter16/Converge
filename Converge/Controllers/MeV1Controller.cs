// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using Converge.Helpers;
using Converge.Models;
using Converge.Models.Enums;
using Converge.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Converge.Controllers
{
    [Authorize]
    [Route("api/v1.0/me")]
    [ApiController]
    public class MeV1Controller : Controller
    {
        /// <summary>
        /// Send logs to telemetry service
        /// </summary>
        private readonly ILogger<MeV1Controller> logger;
        private readonly AppGraphService appGraphService;
        private readonly UserGraphService userGraphService;
        private readonly PredictionService predictionService;
        private readonly TelemetryService telemetryService;
        private readonly BuildingsService buildingsService;
        private readonly PlacesService placesService;
        private readonly PredictedLocationService predictedLocationService;
        private readonly NotificationService notificationService;

        public MeV1Controller(ILogger<MeV1Controller> logger,
                            AppGraphService appGraphService,
                            UserGraphService userGraphService,
                            PredictionService predictionService,
                            TelemetryService telemetryService,
                            BuildingsService buildingsService,
                            PlacesService placesService,
                            PredictedLocationService predictedLocationService,
                            NotificationService notificationService)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.appGraphService = appGraphService;
            this.userGraphService = userGraphService;
            this.predictionService = predictionService;
            this.telemetryService = telemetryService;
            this.buildingsService = buildingsService;
            this.placesService = placesService;
            this.predictedLocationService = predictedLocationService;
            this.notificationService = notificationService;
        }

        /// <summary>
        /// Gets converge settings for the current user.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("convergeSettings")]
        public async Task<ActionResult<ConvergeSettings>> GetMyConvergeSettings()
        {
            return await userGraphService.GetConvergeSettings();
        }

        /// <summary>
        /// Creates/Updates Converge settings for the current user.
        /// </summary>
        /// <param name="convergeSettings">Settings info</param>
        /// <returns></returns>
        [HttpPost]
        [Route("convergeSettings")]
        public async Task<ActionResult> SetMyConvergeSettings(ConvergeSettings convergeSettings)
        {
            if (string.IsNullOrEmpty(convergeSettings.ZipCode))
            {
                this.telemetryService.TrackEvent(TelemetryService.USER_NO_ZIP_CODE);
            }
            ConvergeSettings settings = await userGraphService.GetConvergeSettings();
            if (settings == null)
            {
                await userGraphService.SaveConvergeSettings(convergeSettings, DataOperationType.IsAdd);
            }
            else
            {
                await userGraphService.SaveConvergeSettings(convergeSettings, DataOperationType.IsUpdate);
            }
            return Ok();
        }

        /// <summary>
        /// Gets converge settings for the current user.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("locationPreferences")]
        public async Task<ActionResult<LocationPreferences>> GetMyLocationPreferences()
        {
            ConvergeSettings convergeSettings = await userGraphService.GetConvergeSettings();

            return convergeSettings.LocationPreferences;
        }

        /// <summary>
        /// Gets converge settings for the current user.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("notificationPreferences")]
        public async Task<ActionResult<NotificationPreferences>> GetMyNotificationPreferences()
        {
            ConvergeSettings convergeSettings = await userGraphService.GetConvergeSettings();

            return convergeSettings.NotificationPreferences;
        }

        /// <summary>
        /// Gets current user's direct reports.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("directreports")]
        public async Task<List<User>> GetMyDirectReports()
        {
            try
            {
                List<User> directReports = await userGraphService.GetMyReports();
                return directReports;
            } catch
            {
                return null;
            }

        }

        /// <summary>
        /// Gets current user's workgroup in the organization.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("workgroup")]
        public async Task<List<DirectoryObject>> GetMyWorkgroup()
        {
            var result = new List<DirectoryObject>();
            var manager = await userGraphService.GetMyManager();

            if (manager != null)
            {
                result.Add(manager);
                var colleagues = await userGraphService.GetReports(manager.UserPrincipalName);
                result.AddRange(colleagues);
            }
            else
            {
                this.logger.LogInformation("Manager information is null.");
            }

            // removing direct reports from team
            // var reports = await userGraphService.GetMyReports();

            // if (reports != null)
            // {
            //     result.AddRange(reports);
            // }
            // else
            // {
            //     this.logger.LogInformation("Reports are null.");
            // }

            var userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value;
            return result.Where(u => u.Id != userId).ToList();
        }

        /// <summary>
        /// Gets a list of people as suggestions for the current user.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("people")]
        public async Task<List<Person>> GetMyPeople()
        {
            List<Person> people = await userGraphService.GetMyPeople();
            if (people == null)
            {
                this.logger.LogInformation("People information is null.");
                return new List<Person>();
            }
            string userPrincipalName = User.Claims.ToList().Find(claim => claim.Type == "preferred_username")?.Value;
            userPrincipalName ??= User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn")?.Value;
            userPrincipalName ??= string.Empty;

            Regex tenantRegex = new Regex(@"@(.+)");
            MatchCollection matches = tenantRegex.Matches(userPrincipalName);
            string tenant = (matches.Count > 0) ? matches[^1].Value : string.Empty;

            people.RemoveAll(p => string.IsNullOrEmpty(p.UserPrincipalName) || p.UserPrincipalName.Equals(userPrincipalName) ||
                                    (p.PersonType != null && !p.PersonType.Class.SameAs("Person")));
            return people.Where(p => p.UserPrincipalName.EndsWith(tenant)).ToList();
        }

        /// <summary>
        /// Current user's list of users.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("list")]
        public async Task<List<DirectoryObject>> GetMyList()
        {
            ConvergeSettings convergeSettings = await userGraphService.GetConvergeSettings();
            List<DirectoryObject> result = new List<DirectoryObject>();
            if (convergeSettings.MyList == null)
            {
                this.logger.LogInformation("Users list is null.");
                return result;
            }
            foreach (string upn in convergeSettings.MyList)
            {
                User user = await userGraphService.GetUser(upn);
                Boolean validUser = appGraphService.ValidConvergeUser(user);
                if (user != null && validUser)
                {
                    result.Add(user);
                }
            }
            return result;
        }

        /// <summary>
        /// Current user's followers.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("followers")]
        public async Task<List<DirectoryObject>> GetMyFollowers()
        {
            ConvergeSettings convergeSettings = await userGraphService.GetConvergeSettings();
            List<DirectoryObject> result = new List<DirectoryObject>();
            if (convergeSettings.MyFollowers == null)
            {
                this.logger.LogInformation("Followers list is null.");
                return result;
            }
            foreach (string upn in convergeSettings.MyFollowers)
            {
                User user = await userGraphService.GetUser(upn);
                Boolean validUser = appGraphService.ValidConvergeUser(user);
                if (user != null && validUser)
                {
                    result.Add(user);
                }
            }
            return result;
        }

        /// <summary>
        /// Creates/Updates followers on converge settings for the current user.
        /// </summary>
        /// <param name="myFollowers">Followers info</param>
        /// <returns></returns>
        [HttpPost]
        [Route("followers")]
        public async Task<ActionResult> SetMyFollowers(List<string> myFollowers)
        {
            ConvergeSettings settings = await userGraphService.GetConvergeSettings();
            {
                settings.MyFollowers = myFollowers;
                await userGraphService.SaveConvergeSettings(settings, DataOperationType.IsUpdate);
            }
            return Ok();
        }

        /// <summary>
        /// Current user's list of teammates.
        /// </summary>
        /// <returns>User's Teammates</returns>
        [HttpGet]
        [Route("teammates")]
        public async Task<List<DirectoryObject>> GetMyTeammates()
        {
            List<DirectoryObject> teammates = new List<DirectoryObject>();
            List<DirectoryObject> mylist = await GetMyList();
            List<DirectoryObject> workgroup = await GetMyWorkgroup();

            teammates.AddRange(mylist);
            teammates.AddRange(workgroup);

            List<DirectoryObject> unique = teammates.GroupBy(mate => mate.Id).Select(g => g.First()).ToList();

            return unique;
        }


        /// <summary>
        /// Get all teammates in office for particular day.
        /// </summary>
        /// <param name="year"></param>
        /// <param name="month"></param>
        /// <param name="day"></param>
        /// <returns>Office teammates</returns>
        [HttpGet]
        [Route("officeTeammates")]
        public async Task<List<OfficeTeammate>> GetMyOfficeTeammates(int year, int month, int day)
        {
            List<OfficeTeammate> officeTeammates = new List<OfficeTeammate>();
            List<DirectoryObject> teammates = await GetMyTeammates();
            DateTime date = new DateTime(year, month, day);

            if (teammates == null)
            {
                return officeTeammates;
            }

            // foreach (DirectoryObject mate in teammates)
            // {
            //     try {
            //         UserLocation userLocation = await appGraphService.GetUserLocation(date, mate.Id);

            //         if (userLocation.Name != "Remote" && userLocation.Name != "Out of Office")
            //         {
            //             officeTeammates.Add(mate);
            //         }
            //     }
            //     catch (Exception ex)
            //     {
            //         telemetryService.TrackException(ex, "Failed to get user's converge calendar.");
            //     }
            // }
            var tasks = teammates.Select(async mate => 
            {
                UserLocation userLocation = await appGraphService.GetUserLocation(date, mate.Id);
                if (userLocation.Name != "Remote" && userLocation.Name != "Out of Office" && userLocation.Name != "Unknown")
                {
                    OfficeTeammate officeMate = new OfficeTeammate(mate, userLocation.Name);
                    officeTeammates.Add(officeMate);
                }
            });
            await Task.WhenAll(tasks);
            return officeTeammates;
        }

        /// <summary>
        /// Gets current user's list of opportunities.
        /// </summary>
        /// <param name="year"></param>
        /// <param name="month"></param>
        /// <param name="day"></param>
        /// <returns>User's opportunities are defined as teammates that will be in the same office as the user on a particular day</returns>
        [HttpGet]
        [Route("opportunities")]
        public async Task<List<Opportunity>> GetMyOpportunities(int year, int month, int day)
        {
            List<Opportunity> nullOpportunities = new List<Opportunity>();
            Microsoft.Graph.Calendar calendar = await userGraphService.GetMyConvergeCalendar();
            if (calendar == null)
            {
                this.logger.LogInformation("user's calendar is null.");
                return nullOpportunities;
            }

            Event predictionEvent = await userGraphService.GetMyConvergePrediction(calendar.Id, year, month, day);
            if (predictionEvent == null) {
                return nullOpportunities;
            }
            var myOpportunities = await userGraphService.GetMyOpportunities(calendar.Id, predictionEvent.Id);
            if (myOpportunities == null )
            {
                return nullOpportunities;
            }
            return myOpportunities;
        }

        /// <summary>
        /// Creates/Updates opportunities for the current user.
        /// </summary>
        /// <param name="opportunities">Settings info</param>
        /// <param name="year"></param>
        /// <param name="month"></param>
        /// <param name="day"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("opportunities")]
        public async Task<ActionResult> SetMyOpportunities(Opportunity[] opportunities, int year, int month, int day)
        {
         Microsoft.Graph.Calendar calendar = await userGraphService.GetMyConvergeCalendar();
            if (calendar == null)
            {
                this.logger.LogInformation("user's calendar is null.");
                return null;
            }

            Event prediction = await userGraphService.GetMyConvergePrediction(calendar.Id, year, month, day);
            if (prediction == null)
            {
                return Ok();
            }
            else
            {
                User user = await userGraphService.GetCurrentUser();
                await appGraphService.SaveOpportunities(opportunities.ToList(), user.Id, calendar.Id, prediction.Id, DataOperationType.IsUpdate);
            }
            return Ok();
        }

        /// <summary>
        /// Get Recommended Locations to collaborate for the current user.
        /// </summary>
        /// <param name="year"></param>
        /// <param name="month"></param>
        /// <param name="day"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("location")]
        public async Task<UserLocation> GetMyLocation(int year, int month, int day)
        {
            DateTime date = new DateTime(year, month, day);
            Calendar calendar = await userGraphService.GetMyConvergeCalendar();
            User user = await userGraphService.GetCurrentUser();
            if (calendar == null)
            {
                logger.LogInformation("user's calendar is null.");
                UserLocation userLocation = new UserLocation
                {
                    Name = "Unknown",
                    Uri = "",
                    Date = date,
                };
                return userLocation;
            }
            return await appGraphService.GetUserLocation(date, user.Id);
        }

        /// <summary>
        /// Gets specific User Location for the given date
        /// </summary>
        /// <param name="week">Week number</param>
        /// <param name="year">Year</param>
        /// <returns></returns>
        [HttpGet]
        [Route("locationsByWeek")]
        public async Task<UserWeeklyLocations> GetUserNewLocation(int week, int year)
        {
            User user = await userGraphService.GetCurrentUser();
            return await predictedLocationService.GetMyLocationsByWeek(user, week, year);
        }

        /// <summary>
        /// Sets up a new converge user by adding or updating the
        /// converge settings, calendar and default location predictions
        /// </summary>
        /// <param name="convergeSettings">converge settings</param>
        /// <returns></returns>
        [HttpPost]
        [Route("setup")]
        public async Task SetupNewUser(ConvergeSettings convergeSettings)
        {
            ConvergeSettings settings = await userGraphService.GetConvergeSettings();
            if (settings == null)
            {
                await userGraphService.SaveConvergeSettings(convergeSettings, DataOperationType.IsAdd);
            }
            else
            {
                await userGraphService.SaveConvergeSettings(convergeSettings, DataOperationType.IsUpdate);
            }
            var calendar = await userGraphService.GetMyConvergeCalendar();
            if (calendar == null)
            {
                await userGraphService.CreateMyConvergeCalendar();
            }

            List<OutlookCategory> categories = await userGraphService.GetMyCalendarCategories();
            if (categories.Find(c => c.DisplayName == userGraphService.ConvergeDisplayName) == null)
            {
                await userGraphService.CreateMyCalendarCategory(new OutlookCategory
                {
                    DisplayName = userGraphService.ConvergeDisplayName,
                    Color = CategoryColor.Preset9,
                });
            }

            var userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value;
            WorkingHours workingHours = await userGraphService.GetMyWorkingHours();

            PredictionMetrics predictionMetrics = new PredictionMetrics();
            Dictionary<string, ExchangePlace> placesDictionary = new Dictionary<string, ExchangePlace>();
            // Perform prediction for the given user.
            await predictionService.PerformPrediction(userId, workingHours, placesDictionary, predictionMetrics);

            //If there is a failure only 1 Exception is expected. Log the failure, but do not throw to the user. They can continue to use Converge.
            if (predictionMetrics.ExceptionsList.Count > 0)
            {
                logger.LogError(predictionMetrics.ExceptionsList[0], $"Error while predicting future locations for request: {JsonConvert.SerializeObject(convergeSettings)}");
            }
        }

        /// <summary>
        /// Updates current user's predicted location.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPut]
        [Route("updateLocation")]
        public async Task<ActionResult> UpdatePredictedLocationChosenByUser(UserPredictedLocationRequest request)
        {
            var userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value;
            var date = new DateTime(request.Year, request.Month, request.Day);

            bool isUpdated = await predictionService.UpdatePredictedLocationChosenByUser(date, userId, request.UserPredictedLocation);

            return isUpdated ? Ok() : StatusCode(500);
        }

        /// <summary>
        /// Gets converge calendar for the current user.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("convergeCalendar")]
        public async Task<Calendar> GetMyConvergeCalendar()
        {
            return await userGraphService.GetMyConvergeCalendar();
        }

        /// <summary>
        /// Current user's recent buildings.
        /// </summary>
        /// <returns>Building Basic Information of current user's recent buildings</returns>
        [HttpGet]
        [Route("recentBuildings")]
        public async Task<List<BuildingBasicInfo>> GetRecentBuildings()
        {
            ConvergeSettings convergeSettings = await userGraphService.GetConvergeSettings();
            if (convergeSettings == null)
            {
                logger.LogInformation($"Converge settings is unavailable for the user '{User.Identity.Name}'.");
                return new List<BuildingBasicInfo>();
            }
            if (convergeSettings.RecentBuildingUpns == null)
            {
                logger.LogInformation($"There are no saved recent buildings for the user '{User.Identity.Name}'.");
                return new List<BuildingBasicInfo>();
            }

            var recentBuildingUpns = convergeSettings.RecentBuildingUpns.Distinct().ToList();
            List<BuildingBasicInfo> buildingsBasicInfoList = await buildingsService.GetBuildingsBasicInfo(recentBuildingUpns);
            if (buildingsBasicInfoList.Count != recentBuildingUpns.Count)
            {
                var missingBuildings = recentBuildingUpns.Except(buildingsBasicInfoList.Select(x => x.Identity));
                logger.LogInformation($"Unable to find Buildings by UPNs: {string.Join(", ", missingBuildings)}.");
            }
            else
            {
                logger.LogInformation($"Successfully found {buildingsBasicInfoList.Count} out of {recentBuildingUpns.Count} recent buildings.");
            }

            return buildingsBasicInfoList;
        }

        /// <summary>
        /// Gets the detailed list of Current user's favorite campuses to collaborate
        /// </summary>
        /// <returns>Favorite campuses as a collection of Exchange Places</returns>
        [HttpGet]
        [Route("favoriteCampusesDetails")]
        public async Task<List<ExchangePlace>> GetFavoriteCampuses()
        {
            ConvergeSettings convergeSettings = await userGraphService.GetConvergeSettings();
            if(convergeSettings == null)
            {
                logger.LogInformation($"Converge settings is unavailable for the user '{User.Identity.Name}'.");
                return new List<ExchangePlace>();
            }
            if (convergeSettings.FavoriteCampusesToCollaborate == null || convergeSettings.FavoriteCampusesToCollaborate.Count == 0)
            {
                logger.LogInformation($"There are no favorite campuses for the user '{User.Identity.Name}'.");
                return new List<ExchangePlace>();
            }

            var favoritePlacesUpns = convergeSettings.FavoriteCampusesToCollaborate.Distinct().ToList();
            var placesResponse = await placesService.GetPlacesByPlaceUpns(favoritePlacesUpns);
            if (placesResponse.ExchangePlacesList.Count != favoritePlacesUpns.Count)
            {
                var missingBuildings = favoritePlacesUpns.Except(placesResponse.ExchangePlacesList.Select(x => x.Identity));
                logger.LogInformation($"Unable to find favorite campuses by UPNs: {string.Join(", ", missingBuildings)}.");
            }
            else
            {
                logger.LogInformation($"Successfully found {placesResponse.ExchangePlacesList.Count} out of {favoritePlacesUpns.Count} favorite campuses.");
            }

            return placesResponse.ExchangePlacesList;
        }
    }
}
