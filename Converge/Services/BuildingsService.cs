﻿// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using Converge.Helpers;
using Converge.Models;
using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Principal;
using Converge.Models.Enums;

namespace Converge.Services
{
    public class BuildingsService
    {
        private readonly AppGraphService appGraphService;
        private readonly CachePlacesProviderService cachePlacesProviderService;
        private readonly PlacesService placesService;
        private readonly UserGraphService userGraphService;

        public BuildingsService(AppGraphService appGraphService,
                                CachePlacesProviderService cacheProviderService,
                                PlacesService placesService,
                                UserGraphService userGraphService)
        {
            this.appGraphService = appGraphService;
            this.cachePlacesProviderService = cacheProviderService;
            this.placesService = placesService;
            this.userGraphService = userGraphService;
        }

        private IIdentity principalUserIdentity = null;
        public void SetPrincipalUserIdentity(IIdentity userIdentity)
        {
            principalUserIdentity = userIdentity;
        }

        public async Task<BasicBuildingsResponse> GetBuildingsByName(int? topCount = 100, int? skip = 0)
        {
            BasicBuildingsResponse buildingsResponse = cachePlacesProviderService.GetBuildings(topCount, skip);
            if (buildingsResponse == null)
            {
                List<Building> buildingsList = new List<Building>();

                GraphRoomsListResponse roomsListResponse = await userGraphService.GetRoomListsByName(topCount, skip);
                var roomsList = roomsListResponse.RoomsList.Where(r => r.AdditionalData != null && r.AdditionalData["emailAddress"] != null).ToList();
                if (roomsList.Count == 0)
                {
                    buildingsResponse = new BasicBuildingsResponse(new List<BuildingBasicInfo>());
                }

                buildingsResponse =  new BasicBuildingsResponse(roomsList.Select(r => new BuildingBasicInfo(r.AdditionalData["emailAddress"].ToString(), r.DisplayName)).ToList());

                //Add to Cache.
                cachePlacesProviderService.AddBuildings(buildingsResponse, topCount, skip);
            }

            return buildingsResponse;
        }
        
        public async Task<BasicBuildingsResponse> GetBuildingsByDistance(string sourceGeoCoordinates, double? distanceFromSource)
        {
            GPSCoordinates sourceGpsCoords = await DetermineSourceGpsCoordinates(sourceGeoCoordinates);
            if (sourceGpsCoords == null)
            {
                return new BasicBuildingsResponse(new List<BuildingBasicInfo>());
            }

            CampusSortRequest campusSortRequest = new CampusSortRequest(CampusSortByType.Distance,
                                                                                sourceGpsCoords,
                                                                                distanceFromSource);

            List<Building> buildingsList = new List<Building>();

            GraphExchangePlacesResponse exchangePlacesResponse = await placesService.GetPlacesBySortRequest(campusSortRequest);
            List<string> buildingUpnList = exchangePlacesResponse.ExchangePlacesList.Select(ep => ep.Locality).Distinct().ToList();

            foreach (string buildingUpn in buildingUpnList)
            {
                ExchangePlace exchangePlaceModel = exchangePlacesResponse.ExchangePlacesList.FirstOrDefault(ep => ep.Locality == buildingUpn);
                buildingsList.Add(Building.Instantiate(exchangePlaceModel));
            }

            //Employed Haversine formula.
            buildingsList = campusSortRequest.SortBuildingsByDistance(buildingsList);

            return new BasicBuildingsResponse(buildingsList.Select(b => new BuildingBasicInfo(b.Identity, b.DisplayName)).ToList());
        }

        private async Task<GPSCoordinates> DetermineSourceGpsCoordinates(string sourceGeoCoordinates)
        {
            GPSCoordinates sourceGpsCoords;
            //If the coords are not passed in the request, let's consider the user's current Location's Geo-Coords.
            if (sourceGeoCoordinates != null)
            {
                sourceGpsCoords = GPSCoordinates.FromString(sourceGeoCoordinates);
            }
            else
            {
                userGraphService.SetPrincipalUserIdentity(principalUserIdentity);
                try
                {
                    sourceGpsCoords = await userGraphService.GetCurrentUserCoordinates();
                }
                catch
                {
                    sourceGpsCoords = null;
                }
            }

            return sourceGpsCoords;
        }

        public async Task<BuildingBasicInfo> GetBuildingByDisplayName(string buildingDisplayName)
        {
            BuildingBasicInfo buildingBasicInfo = null;

            var buildingsDisplayNamesList = new List<string>() { buildingDisplayName };
            List<Place> roomsList = await appGraphService.GetRoomListsByDisplayName(buildingsDisplayNamesList);
            if (roomsList == null || roomsList.Count != 1)
            {
                return buildingBasicInfo;
            }

            roomsList[0].AdditionalData.TryGetValue("emailAddress", out object buildingObject);
            string buildingEmailAddress = Convert.ToString(buildingObject);
            if (string.IsNullOrWhiteSpace(buildingEmailAddress))
            {
                return buildingBasicInfo;
            }
            buildingEmailAddress = buildingEmailAddress.Trim();


            return new BuildingBasicInfo(buildingEmailAddress, buildingDisplayName); ;
        }

        public async Task<List<BuildingBasicInfo>> GetBuildingsBasicInfo(List<string> buildingsUpnList)
        {
            List<BuildingBasicInfo> buildingsBasicInfoList = new List<BuildingBasicInfo>();

            if (buildingsUpnList == null || buildingsUpnList.All(x => string.IsNullOrWhiteSpace(x)))
            {
                return buildingsBasicInfoList;
            }

            List<Place> roomLists = await appGraphService.GetRoomListsCollectionByIds(buildingsUpnList);
            roomLists = roomLists.Where(r => r.AdditionalData != null && r.AdditionalData["emailAddress"] != null).ToList();
            if (roomLists.Count == 0)
            {
                return buildingsBasicInfoList;
            }

            foreach (Place room in roomLists)
            {
                room.AdditionalData.TryGetValue("emailAddress", out object buildingObject);
                string buildingEmailAddress = Convert.ToString(buildingObject);
                if (string.IsNullOrWhiteSpace(buildingEmailAddress))
                {
                    continue;
                }

                var buildingBasicInfo = new BuildingBasicInfo(buildingEmailAddress, room.DisplayName);
                buildingsBasicInfoList.Add(buildingBasicInfo);
            }

            return buildingsBasicInfoList;
        }

        public async Task<GraphExchangePlacesResponse> GetPlacesOfBuilding(string buildingUpn,
                                                                            PlaceType? placeType = null,
                                                                            int? topCount = null,
                                                                            string skipToken = null,
                                                                            ListItemFilterOptions listItemFilterOptions = null)
        {
            if (string.IsNullOrWhiteSpace(buildingUpn))
            {
                return new GraphExchangePlacesResponse(new List<ExchangePlace>(), null);
            }

            GraphExchangePlacesResponse exchangePlacesResponse = null;

            //Data when list-item-filter-options is defined, are not cached.
            if (listItemFilterOptions == null)
            {
                exchangePlacesResponse = cachePlacesProviderService.GetPlacesOfBuilding(buildingUpn, placeType, topCount, skipToken);
            }
            if (exchangePlacesResponse == null)
            {
                var buildingsUpnList = new List<string>() { buildingUpn };
                exchangePlacesResponse = await placesService.GetPlacesByBuildingUpns(buildingsUpnList, placeType, topCount, skipToken, listItemFilterOptions);
                if (exchangePlacesResponse.ExchangePlacesList == null || exchangePlacesResponse.ExchangePlacesList.Count() == 0)
                {
                    return new GraphExchangePlacesResponse(new List<ExchangePlace>(), null);
                }

                //Add to Cache.
                cachePlacesProviderService.AddPlacesOfBuilding(exchangePlacesResponse.ExchangePlacesList, placeType, topCount, skipToken);
            }

            return exchangePlacesResponse;
        }

        public async Task<ExchangePlace> GetPlaceByUpn(string placeUpn, PlaceType? placeType = null)
        {
            if (string.IsNullOrWhiteSpace(placeUpn))
            {
                return null;
            }

            ExchangePlace targetPlace = cachePlacesProviderService.GetPlaceByUpn(placeUpn, placeType);
            if (targetPlace == null)
            {
                GraphExchangePlacesResponse exchangePlacesResponse = await placesService.GetPlacesByPlaceUpns(new List<string>() { placeUpn }, placeType);
                //We expect only one entry of its kind.
                targetPlace = (exchangePlacesResponse.ExchangePlacesList != null && exchangePlacesResponse.ExchangePlacesList.Count() > 0) ?
                                                exchangePlacesResponse.ExchangePlacesList[0] : null;

                //Add to Cache.
                cachePlacesProviderService.AddPlaceByUpn(targetPlace, placeType);
            }
            return targetPlace;
        }

        public async Task<GraphExchangePlacesResponse> GetPlacesByUpnsList(List<string> placesUpnList, PlaceType? placeType = null, int? topCount = null, string skipTokenString = null)
        {
            GraphExchangePlacesResponse exchangePlacesResponse = cachePlacesProviderService.GetPlacesByUpnsList(placesUpnList, placeType, topCount, skipTokenString);
            if (exchangePlacesResponse == null)
            {
                exchangePlacesResponse = await placesService.GetPlacesByPlaceUpns(placesUpnList, placeType, topCount, skipTokenString);

                //Add to Cache.
                cachePlacesProviderService.AddPlacesByUpnsList(exchangePlacesResponse, placeType, topCount, skipTokenString);
            }

            return exchangePlacesResponse;
        }

        public async Task<ConvergeSchedule> GetWorkspacesScheduleForBuilding(string buildingUpn, string start, string end)
        {
            string nonNullEmail = buildingUpn ?? throw new ArgumentNullException(nameof(buildingUpn));
            string nonNullStartString = start ?? throw new ArgumentNullException(nameof(start));
            string nonNullEndString = end ?? throw new ArgumentNullException(nameof(end));

            GraphExchangePlacesResponse exchangePlacesResponse = await GetPlacesOfBuilding(nonNullEmail, PlaceType.Space);
            if (exchangePlacesResponse.ExchangePlacesList == null || exchangePlacesResponse.ExchangePlacesList.Count == 0)
            {
                return new ConvergeSchedule();
            }
            var buildingCapacity = exchangePlacesResponse.ExchangePlacesList.Sum(ws => ws.Capacity);
            if (buildingCapacity == 0)
            {
                return new ConvergeSchedule();
            }

            double reserved = 0;
            foreach (ExchangePlace workspace in exchangePlacesResponse.ExchangePlacesList)
            {
                if (workspace.Capacity == 0)
                {
                    continue;
                }
                double workspaceReserved = await placesService.GetReserved(workspace, nonNullStartString, nonNullEndString);
                reserved += workspaceReserved * ((double) workspace.Capacity / (double) buildingCapacity);
            }

            return new ConvergeSchedule
            {
                Reserved = reserved,
                Available = 100 - reserved,
            };
        }

        public async Task<BuildingSearchInfo> SearchForBuildings(string searchString, int? topCount = 100, int? skip = 0)
        {
            List<BuildingBasicInfo> buildingsBasicInfoList = new List<BuildingBasicInfo>();
            
            if (string.IsNullOrWhiteSpace(searchString))
            {
                return new BuildingSearchInfo(buildingsBasicInfoList);
            }

            GraphRoomsListResponse roomListsResponse = await userGraphService.SearchRoomLists(searchString, topCount, skip);
            foreach (Place room in roomListsResponse.RoomsList)
            {
                room.AdditionalData.TryGetValue("emailAddress", out object buildingObject);
                string buildingEmailAddress = Convert.ToString(buildingObject);
                if (string.IsNullOrWhiteSpace(buildingEmailAddress) || buildingEmailAddress.OneAmong(buildingsBasicInfoList.Select(x => x.Identity)))
                {
                    continue;
                }

                var buildingBasicInfo = new BuildingBasicInfo(buildingEmailAddress, room.DisplayName);
                buildingsBasicInfoList.Add(buildingBasicInfo);
            }

            return new BuildingSearchInfo(buildingsBasicInfoList);
        }
    }
}
