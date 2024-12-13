// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using Converge.Models;
using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Converge.Services
{
    public class PredictedLocationService
    {
        private readonly AppGraphService appGraphService;

        public PredictedLocationService(AppGraphService appGraphService)
        {
            this.appGraphService = appGraphService;
        }

        /// <summary>
        /// Gets all the current users predicted locations for a week.
        /// </summary>
        /// <param name="user">User</param>
        /// <param name="week">Week number in question</param>
        /// <param name="year">Year number in question</param>
        /// <returns>UserWeeklyLocations</returns>
        public async Task<UserWeeklyLocations> GetMyLocationsByWeek(User user, int week, int year)
        {
            LocationPreferences locationPreference = await appGraphService.GetUserLocationPreferences(user.UserPrincipalName);
            DateTime firstDay = new DateTime(year, 1, 1).AddDays((week - 1) * 7);
            List<DateTime> weekDates = Enumerable.Range(0,7).Select(d => firstDay.AddDays(d)).ToList();
            List<UserLocation> locationsList = new List<UserLocation>();
            foreach (DateTime dateOfWeek in weekDates)
            {
                UserLocation userLocation = await appGraphService.GetUserLocation(dateOfWeek, user.Id);
                locationsList.Add(userLocation);
            }
            var locationsResponse = new UserWeeklyLocations(user.UserPrincipalName, week, firstDay.Year, locationsList)
            {
                UserId = user.UserPrincipalName,
                Week = week,
                Year = firstDay.Year,
                LocationsList = locationsList,
            };

            return locationsResponse;
        }

        /// <summary>
        /// Gets all the users predicted locations for a week.
        /// </summary>
        /// <param name="userId">Id of the user</param>
        /// <param name="week">Week number in question</param>
        /// <param name="year">Year number in question</param>        
        /// <returns>UserLocation</returns>
        public async Task<UserWeeklyLocations> GetUserLocationsByWeek(string userId, int week, int year)
        {
            LocationPreferences locationPreference = await appGraphService.GetUserLocationPreferences(userId);
            DateTime firstDay = new DateTime(year, 1, 1).AddDays((week - 1) * 7);
            List<DateTime> weekDates = Enumerable.Range(0,7).Select(d => firstDay.AddDays(d)).ToList();
            List<UserLocation> locationsList = new List<UserLocation>();
            foreach (DateTime dateOfWeek in weekDates)
            {
                UserLocation userLocation = await appGraphService.GetUserLocation(dateOfWeek, userId);
                locationsList.Add(userLocation);
            }
            var locationsResponse = new UserWeeklyLocations(userId, week, firstDay.Year, locationsList)
            {
                UserId = userId,
                Week = week,
                Year = firstDay.Year,
                LocationsList = locationsList,
            };

            return locationsResponse;
        }
    }
}
