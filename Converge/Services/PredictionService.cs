// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using Converge.Helpers;
using Converge.Models;
using Converge.Models.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Converge.Services
{
    public class PredictionService
    {
        private readonly IConfiguration configuration;
        private readonly AppGraphService appGraphService;
        private readonly BuildingsMonoService buildingsMonoService;
        private readonly TelemetryService telemetryService;
        private readonly NotificationService notificationService;

        public PredictionService(IConfiguration configuration,
                                    TelemetryService telemetryService,
                                    AppGraphService appGraphService,
                                    BuildingsMonoService buildingsMonoSvc,
                                    NotificationService notificationService)
        {
            this.configuration = configuration;
            this.telemetryService = telemetryService;
            this.appGraphService = appGraphService;
            this.buildingsMonoService = buildingsMonoSvc;
            this.notificationService = notificationService;
        }

        public int MaxPredictionWindow => int.Parse(configuration["MaxPredictionWindow"]);

        public async Task PerformPrediction(string userId, WorkingHours workingHours, Dictionary<string, ExchangePlace> placesDictionary, PredictionMetrics predictionMetrics)
        {
            // This needs to be "now" in the user's timezone
            DateTime today = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, workingHours.TimeZone.Name);
            today = today.Initialize(new TimeOfDay(0, 0, 0));

            List<Event> eventsList = await GetAllEventsList(userId, today, today.AddDays(MaxPredictionWindow));
            // telemetryService.TrackEvent("Get all events", userId + ": ", eventsList);
            if (eventsList == null || eventsList.Count == 0 || eventsList.All(e => e.Locations == null && e.Location == null))
            {
                return;
            }

            await CollectPlacesFromEvents(eventsList, placesDictionary);

            List<DateTimeLimit> predictionWindowList = new List<DateTimeLimit>();
            for (int i = 0; i < MaxPredictionWindow; i++)
            {
                DateTime startDateTime = DateTime.Today.ToUniversalTime().AddDays(i);
                DateTime endDateTime = DateTime.Today.ToUniversalTime().AddDays(i + 1);

                if (workingHours.DaysOfWeek != null && workingHours.DaysOfWeek.Count() > 0)
                {
                    var weekDay = Enum.Parse<Microsoft.Graph.DayOfWeek>(startDateTime.DayOfWeek.ToString(), true);
                    if (!workingHours.DaysOfWeek.Contains(weekDay))
                    {
                        continue;
                    }
                }
                DateTimeLimit predictionWindow = new DateTimeLimit(startDateTime, endDateTime, workingHours.TimeZone.Name);
                predictionWindowList.Add(predictionWindow);
            }

            object locker = new object();
            Parallel.For(0, predictionWindowList.Count, async i =>
            {
                try
                {
                    var start = predictionWindowList[i].Start;
                    var end = predictionWindowList[i].End;
                    Location predictedLocation = GetPredictedLocation(start, end, eventsList, placesDictionary, out DateTimeOffset? lastWorkspaceBookingModified);
                    telemetryService.TrackEvent("Get predicted location", "predicted Location for: " + userId + " day: " + start + " timezone: " + TimeZoneInfo.ConvertTimeBySystemTimeZoneId(start, workingHours.TimeZone.Name) , predictedLocation);
                    await CreateOrUpdatePrediction(userId, predictedLocation, start, false, lastWorkspaceBookingModified);
                }
                catch (Exception e)
                {
                    lock (locker)
                    {
                        string previousMessage = predictionMetrics.ExceptionUser.ContainsKey(userId) ? predictionMetrics.ExceptionUser[userId] : string.Empty;
                        predictionMetrics.ExceptionUser[userId] = new StringBuilder(previousMessage + e.Message + ". ").ToString();
                        predictionMetrics.ExceptionsList.Add(e);
                    }
                }
            });

            // Update followers and trigger notifications
            await appGraphService.UpdateFollowers(userId);
            await notificationService.TriggerScheduledNotifications(userId, workingHours);

            return;
        }

        public async Task<List<Event>> GetAllEventsList(string id, DateTime start, DateTime end)
        {
            return await appGraphService.GetAllEvents(
                                                id,
                                                new DateTime(start.Year, start.Month, start.Day).ToString("o"),
                                                new DateTime(end.Year, end.Month, end.Day).ToString("o"),
                                                "isCancelled eq false");
        }

        public async Task CollectPlacesFromEvents(List<Event> eventsList, Dictionary<string, ExchangePlace> placesDictionary)
        {
            List<string> placeUpnsList = new List<string>();
            eventsList.Where(e => e.Location != null).Select(x => x.Location)
                        .Where(y => !string.IsNullOrWhiteSpace(y.UniqueId) && !string.IsNullOrWhiteSpace(y.LocationUri))
                        .ToList()
                        .ForEach(x =>
                        {
                            if (!x.LocationUri.OneAmong(placeUpnsList))
                            {
                                placeUpnsList.Add(x.LocationUri);
                            }
                        });
            if (placeUpnsList.Count == 0)
            {
                return;
            }

            // Remove if pre-exists in the dictionary.
            placeUpnsList.RemoveAll(x => placesDictionary.ContainsKey(x));
            if (placeUpnsList.Count != 0)
            {
                // Get Places by Places-Upns-list
                GraphExchangePlacesResponse exchangePlacesResponse = await buildingsMonoService.GetPlacesByUpnsList(placeUpnsList);
                if (exchangePlacesResponse != null)
                {
                    foreach (var place in exchangePlacesResponse?.ExchangePlacesList)
                    {
                        placesDictionary[place.Identity] = place;
                    }
                }
            }
        }

        public Location GetPredictedLocation(DateTime start, DateTime end, List<Event> eventsList, Dictionary<string, ExchangePlace> placesDictionary, out DateTimeOffset? lastWorkspaceBookingModified)
        {
            Location topLocation = null;
            lastWorkspaceBookingModified = null;

            List<Event> filteredEventsList = eventsList.Where(e => IsEventOnDay(start, end, e)).ToList();

            // When Events are not right, we return back null.
            if (filteredEventsList == null || filteredEventsList.Count == 0)
            {
                return topLocation;
            }

            // Make a prediction about where they are
            IDictionary<string, int> locationCount = new Dictionary<string, int>();
            IDictionary<string, Location> locations = new Dictionary<string, Location>();

            foreach (Event e in filteredEventsList)
            {
                // telemetryService.TrackEvent("Get locations from event", "locations", e.Locations);
                var locationsWithUri = e.Locations.Where(x => !string.IsNullOrWhiteSpace(x.LocationUri));
                var eventLocations = locationsWithUri.Where(y => placesDictionary.ContainsKey(y.LocationUri));
                // telemetryService.TrackEvent("Filter for events with locationUri", "eventLocations", eventLocations);
                foreach (Location location in eventLocations)
                {
                    // telemetryService.TrackEvent("For each location get uri", "location", location);
                    ExchangePlace place = placesDictionary[location.LocationUri];
                    // if null check showAs property, if "oof" user will be OOO or it is a Holiday
                    if (place == null)
                    {
                        if (e.ShowAs == FreeBusyStatus.Oof) {
                            topLocation = new Location()
                            {
                                DisplayName = "Out of Office"
                            };
                        } else {
                            continue;
                        }
                    }

                    Location normalizedLocation = NormalizeLocation(place);
                    if (place.Type == PlaceType.Space)
                    {
                        topLocation = normalizedLocation;
                        lastWorkspaceBookingModified = e.LastModifiedDateTime;
                        break;
                    }
                    if (locationCount.ContainsKey(normalizedLocation.DisplayName))
                    {
                        locationCount[normalizedLocation.DisplayName] += 1;
                    }
                    else
                    {
                        locationCount[normalizedLocation.DisplayName] = 1;
                    }
                    locations[normalizedLocation.DisplayName] = normalizedLocation;
                }
            }

            if (topLocation != null)
            {
                return topLocation;
            }

            int count = 0;
            foreach (KeyValuePair<string, int> location in locationCount)
            {
                if (location.Value > count)
                {
                    topLocation = locations[location.Key];
                    count = location.Value;
                }
            }
            if (count < 2)
            {
                return null;
            }
            return topLocation;
        }

        public async Task<Location> GetDefaultLocation(DateTime start, string userId)
        {
            LocationPreferences locationPreference = await appGraphService.GetUserLocationPreferences(userId);
            if (locationPreference == null) {
                return null;
            }
            var dayOfWeek = start.DayOfWeek.ToString();
            var prop = typeof(LocationPreferences).GetProperty(dayOfWeek);
            if (prop != null && prop.GetValue(locationPreference) as string == "In-office")
            {
                GraphExchangePlacesResponse place = await buildingsMonoService.GetPlacesByUpnsList(new List<string>() { locationPreference.DefaultBuilding });
                if (place.ExchangePlacesList.Count == 0)
                {
                    return null;
                } else
                {
                    return NormalizeLocation(place.ExchangePlacesList[0]);
                }
            }
            return null;
        }

        /// <summary>
        /// Creates a new Converge prediction if none exists, or updates the existing prediction with a new location.
        /// </summary>
        /// <param name="userId">The ID of the user</param>
        /// <param name="newLocation">The location of the Converge prediction.</param>
        /// <param name="start">The date of the prediction.</param>
        /// <param name="triggeredByUser">Whether the update is coming directly from the user and not the background job.</param>
        /// <param name="lastWorkspaceBookingModified">The date of the last updated workspace booking on this day, if any.</param>
        /// <returns>A task.</returns>
        public async Task CreateOrUpdatePrediction(string userId, Location newLocation, DateTime start, bool triggeredByUser = false, DateTimeOffset? lastWorkspaceBookingModified = null)
        {
            telemetryService.TrackEvent("LocationPredictor: Starting CreateOrUpdatePrediction: " + userId);
            DateTime todayDate = DateTime.Today;
            Calendar convergeCalendar = await appGraphService.GetConvergeCalendar(userId);
            if (convergeCalendar == null)
            {
                telemetryService.TrackEvent(TelemetryService.CONVERGE_CALEDNAR_REMOVED);
                return;
            }

            Location defaultLocation = await GetDefaultLocation(start, userId);
            Event prediction = await appGraphService.GetConvergePrediction(userId, convergeCalendar.Id, start.Year, start.Month, start.Day);
            bool isWorkspaceBookingMostRecent = false;
            bool isSavedPredictionUserSet = false;
            string defaultDisplayName = defaultLocation?.DisplayName ?? null;
            string newDisplayName = newLocation?.DisplayName ?? null;
            string oldDisplayName = null;

            if (prediction != null)
            {
                oldDisplayName = prediction.Location.DisplayName ?? null;
                isSavedPredictionUserSet = prediction.SingleValueExtendedProperties?
                                            .Any(svep => svep.Id == appGraphService.ConvergePredictionSetByUser && svep.Value == "true") ?? false;

                if (lastWorkspaceBookingModified != null)
                {
                    isWorkspaceBookingMostRecent = lastWorkspaceBookingModified > prediction.LastModifiedDateTime;
                }
                await UpdateUsersOpportunities(userId, convergeCalendar.Id, start.Year, start.Month, start.Day);
            }

            if (oldDisplayName == null && newDisplayName == null)
            {
                if (defaultDisplayName == null)
                {
                    // null, null, null
                    return;
                }
                else if (start > todayDate && !triggeredByUser)
                {
                    // null, null, value
                    Event ev = NormalizeEvent(defaultLocation, start);
                    if (triggeredByUser)
                    {
                        ev.Location = newLocation;
                        ev.Locations = new List<Location> { newLocation };
                        ev.SingleValueExtendedProperties = new EventSingleValueExtendedPropertiesCollectionPage
                        {
                            new SingleValueLegacyExtendedProperty
                            {
                                Id = appGraphService.ConvergePredictionSetByUser,
                                Value = triggeredByUser ? "true" : "false",
                            }
                        };
                    }
                    await appGraphService.CreateConvergePrediction(userId, convergeCalendar.Id, ev, false);
                    // using standalone discard as to not wait for this to finish processing
                    _ = Task.Run(() => LocationChangeBackgroundUpdates(userId, convergeCalendar.Id, start.Year, start.Month, start.Day, ev.Location.LocationUri));
                }
                return;
            }
            // value, value; old = new
            else if (oldDisplayName == newDisplayName)
            {
                return;
            }
            // null, value
            else if (oldDisplayName == null && newDisplayName != null)
            {
                Event ev = NormalizeEvent(newLocation, start);
                    if (triggeredByUser)
                    {
                        ev.Location = newLocation;
                        ev.Locations = new List<Location> { newLocation };
                        ev.SingleValueExtendedProperties = new EventSingleValueExtendedPropertiesCollectionPage
                        {
                            new SingleValueLegacyExtendedProperty
                            {
                                Id = appGraphService.ConvergePredictionSetByUser,
                                Value = triggeredByUser ? "true" : "false",
                            }
                        };
                    }
                await appGraphService.CreateConvergePrediction(userId, convergeCalendar.Id, ev, false);
                // using standalone discard as to not wait for this to finish processing
                _ = Task.Run(() => LocationChangeBackgroundUpdates(userId, convergeCalendar.Id, start.Year, start.Month, start.Day, ev.Location.LocationUri));

            }
            // value, null
            else if (oldDisplayName != null && newDisplayName == null)
            {
                if (triggeredByUser)
                {
                    await appGraphService.DeleteEvent(userId, prediction.Id);
                }
                else if (isSavedPredictionUserSet)
                {
                    return;
                }
                else if (oldDisplayName != defaultDisplayName && triggeredByUser)
                {
                    await appGraphService.DeleteEvent(userId, prediction.Id); 
                }
                return;
            }
            else if (oldDisplayName != null && newDisplayName != null)
            {
                // value, value && old != new
                if (oldDisplayName != newDisplayName)
                {
                    if (triggeredByUser)
                    {
                        prediction.Location = newLocation;
                        prediction.Locations = new List<Location> { newLocation };
                        prediction.SingleValueExtendedProperties = new EventSingleValueExtendedPropertiesCollectionPage
                        {
                            new SingleValueLegacyExtendedProperty
                            {
                                Id = appGraphService.ConvergePredictionSetByUser,
                                Value = triggeredByUser ? "true" : "false",
                            }
                        };

                        await appGraphService.UpdateEvent(userId, prediction);
                        // using standalone discard as to not wait for this to finish processing
                        _ = Task.Run(() => LocationChangeBackgroundUpdates(userId, convergeCalendar.Id, start.Year, start.Month, start.Day, prediction.Location.LocationUri));
                    }
                }
            }
        }

        /// <summary>
        /// Formats inputs to prepare for CreateOrUpdatePrediction function to create or update the predicition
        /// </summary>
        /// <param name="startDate">The date of the prediction.</param>
        /// <param name="userId">The ID of the user</param>
        /// <param name="userPredictedLocation">The location for the predicition, coming directly from the user.</param>
        /// <returns>Boolean once completed</returns>
        public async Task<bool> UpdatePredictedLocationChosenByUser(DateTime startDate, string userId, UserPredictedLocation userPredictedLocation)
        {
            Location location = null;

            if (!string.IsNullOrWhiteSpace(userPredictedLocation.CampusUpn))
            {
                GraphExchangePlacesResponse exchangePlacesResponse = await buildingsMonoService.GetPlacesOfBuilding(userPredictedLocation.CampusUpn);
                var place = exchangePlacesResponse.ExchangePlacesList.FirstOrDefault();
                if (place != null)
                {
                    location = new Location()
                    {
                        LocationUri = userPredictedLocation.CampusUpn,
                        DisplayName = place.Building ?? place.DisplayName,
                        Address = new PhysicalAddress
                        {
                            Street = place.Street,
                            City = place.City,
                            PostalCode = place.PostalCode,
                            State = place.State,
                            CountryOrRegion = place.CountryOrRegion,
                        },
                        Coordinates = (place.GpsCoordinates == null) ? null : new OutlookGeoCoordinates()
                        {
                            Latitude = place.GpsCoordinates.Latitude,
                            Longitude = place.GpsCoordinates.Longitude
                        }
                    };
                }
            }
            else if (!string.IsNullOrEmpty(userPredictedLocation.OtherLocationOption))
            {
                location = new Location()
                {
                    DisplayName = userPredictedLocation.OtherLocationOption
                };
            }

            if (location == null)
            {
                return false;
            }

            await CreateOrUpdatePrediction(userId, location, startDate, true);
            return true;
        }

        /// <summary>
        /// Takes in a place and returns a MS Graph Location
        /// </summary>
        /// <param name="place">The location of the Converge prediction.</param>
        /// <returns>A Location.</returns>
        private Location NormalizeLocation(ExchangePlace place)
        {
            return new Location
            {
                DisplayName = place.Building ?? place.DisplayName,
                Address = new PhysicalAddress
                {
                    Street = place.Street,
                    City = place.City,
                    PostalCode = place.PostalCode,
                    State = place.State,
                    CountryOrRegion = place.CountryOrRegion,
                },
                Coordinates = (place.GpsCoordinates == null) ? null : new OutlookGeoCoordinates()
                {
                    Latitude = place.GpsCoordinates.Latitude,
                    Longitude = place.GpsCoordinates.Longitude
                },
            };
        }

        /// <summary>
        /// Takes in location and date and returns a MS Graph Event
        /// </summary>
        /// <param name="location">The location of the Converge prediction.</param>
        /// <param name="start">The date of the prediction.</param>
        /// <returns>An Event.</returns>
        private Event NormalizeEvent(Location location, DateTime start)
        {
            DateTime startDateTime = new DateTime(start.Year, start.Month, start.Day);
            DateTime endDateTime = startDateTime.AddHours(24);

            return new Event
            {
                Subject = "Converge Prediction",
                OriginalEndTimeZone = "UTC",
                OriginalStartTimeZone = "UTC",
                OriginalStart = startDateTime.ToUniversalTime(),
                Start = new DateTimeTimeZone
                {
                    DateTime = startDateTime.ToString("O"),
                    TimeZone = "UTC"
                },
                End = new DateTimeTimeZone
                {
                    DateTime = endDateTime.ToString("O"),
                    TimeZone = "UTC"
                },
                ShowAs = FreeBusyStatus.Free,
                Categories = new List<string> { appGraphService.ConvergeDisplayName },
                IsReminderOn = false,
                IsAllDay = true,
                Location = location,
                Locations = new List<Location> { location },
            };
        }

        private bool IsEventOnDay(DateTime start, DateTime end, Event e)
        {
            // All day events are always from midnight to midnight, no matter what time zone they are retrieved in
            bool isAllDayOnDay = e.Start.CompareTo(new DateTime(start.Year, start.Month, start.Day)) == 0 && e.End.CompareTo(new DateTime(end.Year, end.Month, end.Day)) == 0 && (bool)e.IsAllDay;
            bool isOnDay = e.Start.CompareTo(start) >= 0 && e.End.CompareTo(end) <= 0;
            return isOnDay || isAllDayOnDay;
        }

        private async Task LocationChangeBackgroundUpdates(string userId, string calendarId, int year, int month, int day, string campusUpn)
        {
            var date = new DateTime(year, month, day);
            var updateProps = new Dictionary<string, string>
            {
                {"userId", userId},
                {"date", date.ToShortDateString()}
            };

            telemetryService.TrackEvent("User location change background updates started", updateProps);
            await UpdateUsersOpportunities(userId, calendarId, year, month, day);

            // Get followers and trigger notifications
            List<string> followerUpns = await appGraphService.GetFollowers(userId);
            Opportunity opportunity = new Opportunity()
            {
                User = await appGraphService.GetUser(userId),
                UserId = userId,
                Location = campusUpn,
                Dismissed = false,
                SetByUser = true,
            };
            await UpdateUsersOpportunities(userId, calendarId, year, month, day);

            foreach (string upn in followerUpns)
            {
                await notificationService.TriggerRealTimeNotifications(upn, date, opportunity);
            }
            telemetryService.TrackEvent("User location change background updates completed");
        }

        private async Task<List<Opportunity>> UpdateUsersOpportunities(string userId, string calendarId, int year, int month, int day)
        {
            List<Opportunity> nullOpportunities = new List<Opportunity>();
            Event predictionEvent = await appGraphService.GetConvergePrediction(userId, calendarId, year, month, day);
            if (predictionEvent == null) {
                return nullOpportunities;
            }
            string userLocation = predictionEvent.Location.DisplayName;
            List<DirectoryObject> teammates = await appGraphService.GetTeammates(userId);
            List<Opportunity> opportunities = await appGraphService.FindUsersOpportunities(teammates, userLocation, year, month, day);
            bool isNullOrEmpty = opportunities?.Any() != true;
            if (!isNullOrEmpty)
            {
                telemetryService.TrackEvent("Opportunities identified", "opportunities", opportunities);
                await appGraphService.SaveOpportunities(opportunities, userId, calendarId, predictionEvent.Id, DataOperationType.IsUpdate);
            }

            return opportunities;
        }
    }
}