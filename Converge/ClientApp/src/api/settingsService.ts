// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import AdminSettings from "../types/AdminSettings";
import AutoWrapperResponse from "../types/AutoWrapperResponse";
import AppSettings from "../types/Settings";
import AuthenticationService from "./AuthenticationService";

export default class SettingsService {
  private authenticationService: AuthenticationService;

  constructor(authenticationService: AuthenticationService) {
    this.authenticationService = authenticationService;
  }

  getAppSettings = async (): Promise<AppSettings> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<AppSettings>>("/api/v1.0/settings/appSettings");
    return request.data.result;
  };

  getAdminSettings = async (): Promise<AdminSettings> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<AdminSettings>>("/api/v1.0/settings/adminSettings");
    return request.data.result;
  }

  setAdminSettings = async (adminSettings: AdminSettings): Promise<AdminSettings> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.post<AutoWrapperResponse<AdminSettings>>("/api/v1.0/settings/adminSettings", adminSettings);
    return request.data.result;
  }

  isConvergeAdmin = async (userId: string | undefined): Promise<boolean> => {
    const axios = await this.authenticationService.getAxiosClient();
    const request = await axios.get<AutoWrapperResponse<any>>(`/api/v1.0/settings/isConvergeAdmin?userId=${userId}`);
    return request.data.result;
  }
}
