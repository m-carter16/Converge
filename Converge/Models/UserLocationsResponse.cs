// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Converge.Models
{
    public class UserWeeklyLocations
    {
        public string UserId { get; set; }
        
        public int Week { get; set; }

        public int Year { get; set; }
        
        public List<UserLocation> LocationsList { get; set; }
        
        public UserWeeklyLocations(string userId, int week, int year, List<UserLocation> locationsList)
        {
            UserId = userId;
            Week = week;
            Year = year;
            LocationsList = locationsList;
        }
    }
}