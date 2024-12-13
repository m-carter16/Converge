// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { ConvergeSettings, LocationPreferences, NotificationPreferences } from "../types/ConvergeSettings";
import AutoWrapperResponse from "../types/AutoWrapperResponse";
import UserPredictedLocationRequest from "../types/UserPredictedLocationRequest";
import BuildingBasicInfo from "../types/BuildingBasicInfo";
import ExchangePlace from "../types/ExchangePlace";
import AuthenticationService from "./AuthenticationService";
import Opportunity from "../types/Opportunity";
import UserWeeklyLocations from "../types/UserWeeklyLocations";
import UserLocation from "../types/UserLocation";
import OfficeTeammate from "../types/OfficeTeammate";

export default class MeService {
  private authenticationService: AuthenticationService;

  constructor(authenticationService: AuthenticationService) {
    this.authenticationService = authenticationService;
  }

  getSettings = async (): Promise<ConvergeSettings | null> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<ConvergeSettings>>(
      "/api/v1.0/me/convergeSettings",
    );
    if (request.status === 204) {
      return null;
    }
    return request.data.result;
  };

  getNotificationPreferences = async (): Promise<NotificationPreferences> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<NotificationPreferences>>(
      "/api/v1.0/me/notificationPreferences",
    );
    return request.data.result;
  }

  getLocationPreferences = async () : Promise<LocationPreferences> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<LocationPreferences>>(
      "/api/v1.0/me/locationPreferences",
    );
    return request.data.result;
  }

  setSettings = async (settings: ConvergeSettings): Promise<void> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = axios.post("/api/v1.0/me/convergeSettings", settings);
    return (await request).data.result;
  };

  setupNewUser = async (settings: ConvergeSettings): Promise<void> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = axios.post("/api/v1.0/me/setup", settings);
    return (await request).data.result;
  };

  getWorkgroup = async (): Promise<MicrosoftGraph.User[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<MicrosoftGraph.User[]>>(
      "/api/v1.0/me/workgroup",
    );
    return request.data.result;
  };

  getPeople = async (): Promise<MicrosoftGraph.User[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<MicrosoftGraph.User[]>>(
      "/api/v1.0/me/people",
    );
    return request.data.result;
  };

  getMyList = async (): Promise<MicrosoftGraph.User[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<MicrosoftGraph.User[]>>(
      "/api/v1.0/me/list",
    );
    return request.data.result;
  };

  getMyFollowers = async (): Promise<MicrosoftGraph.User[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<MicrosoftGraph.User[]>>(
      "/api/v1.0/me/followers",
    );
    return request.data.result;
  };

  setMyFollowers = async (myFollowers: string[]): Promise<MicrosoftGraph.User[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.post<AutoWrapperResponse<MicrosoftGraph.User[]>>(
      "/api/v1.0/me/followers",
      myFollowers,
    );
    return request.data.result;
  };

  getMyTeammates = async (): Promise<MicrosoftGraph.User[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<MicrosoftGraph.User[]>>(
      "/api/v1.0/me/teammates",
    );
    return request.data.result;
  };

  getMyDirectReports = async (): Promise<MicrosoftGraph.User[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<MicrosoftGraph.User[]>>(
      "/api/v1.0/me/directreports",
    );
    return request.data.result;
  };

  getMyOfficeTeammates = async (
    year: number, month: number, day: number,
  ): Promise<OfficeTeammate[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<OfficeTeammate[]>>(
      "/api/v1.0/me/officeTeammates",
      {
        params: {
          year, month, day,
        },
      },
    );
    return request.data.result;
  };

  getMyOpportunities = async (
    year: number, month: number, day: number,
  ): Promise<Opportunity[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<Opportunity[]>>(
      "/api/v1.0/me/opportunities",
      {
        params: {
          year, month, day,
        },
      },
    );
    return request.data.result;
  }

  updateMyOpportunities = async (
    year: number,
    month: number,
    day: number,
    opportunities: Opportunity[],
  ): Promise<Opportunity[] | null> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<Opportunity[]>>(
      "/api/v1.0/me/updateOpportunities",
      {
        params: {
          year, month, day, opportunities,
        },
      },
    );
    if (request.status === 200) {
      return opportunities;
    }
    return null;
  }

  // used on dashboard
  updateMyPrediction = async (
    request: UserPredictedLocationRequest,
  ): Promise<string | undefined> => {
    const axios = await this.authenticationService.getAxiosClient();
    const response = await axios.put("/api/v1.0/me/updateLocation", request);
    if (response.status === 200) {
      return request.userPredictedLocation.campusUpn
        ? request.userPredictedLocation.campusUpn
        : request.userPredictedLocation.otherLocationOption;
    }
    return "";
  };

  updateMyLocation = async (
    request: UserPredictedLocationRequest,
  ): Promise<void> => {
    const axios = await this.authenticationService.getAxiosClient();
    const response = await axios.put("/api/v1.0/me/updateLocation", request);
    return response.data.result;
  };

  getMyLocation = async (
    year: number,
    month: number,
    day: number,
  ): Promise<UserLocation> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<UserLocation>>(
      "/api/v1.0/me/location",
      { params: { year, month, day } },
    );
    return request.data.result;
  };

  getMyWeeklyLocations = async (week: number, year: number): Promise<UserWeeklyLocations> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<UserWeeklyLocations>>("/api/v1.0/me/locationsByWeek", {
      params: { week, year },
    });
    return request.data.result;
  };

  getConvergeCalendar = async (
  ): Promise<MicrosoftGraph.Calendar | null> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<MicrosoftGraph.Calendar>>("/api/v1.0/me/convergeCalendar");
    if (request.status === 204) {
      return null;
    }
    return request.data.result;
  };

  getRecentBuildingsBasicDetails = async (
  ): Promise<BuildingBasicInfo[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<BuildingBasicInfo[]>>("/api/v1.0/me/recentBuildings");
    return request.data.result;
  };

  getFavoritePlaces = async (
  ): Promise<ExchangePlace[]> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<ExchangePlace[]>>("/api/v1.0/me/favoriteCampusesDetails");
    return request.data.result;
  };
}
