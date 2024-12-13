// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GeoCoordinates } from "@microsoft/microsoft-graph-types";

export interface NotificationPreferences {
  email?: boolean;
  teams?: boolean;
  inApp?: boolean;
  frequency?: string;
  time?: string;
  day?: string;
}

export interface LocationPreferences {
  [key: string]: string | undefined;
  defaultLocation?: string;
  zipCode?: string;
  defaultBuilding?: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface ConvergeSettings {
  preferredBuildings?: string[];
  zipCode?: string;
  isConvergeUser?: boolean;
  myList?: string[];
  myFollowers?: string[];
  likedSections?: string[];
  dislikedSections?: string[];
  lastNPSDate?: string;
  favoriteVenuesToCollaborate?: string[];
  favoriteCampusesToCollaborate?: string[];
  convergeInstalledDate?: string;
  recentBuildingUpns?: string[];
  geoCoordinates?: GeoCoordinates;
  notificationPreferences?: NotificationPreferences;
  locationPreferences?: LocationPreferences;
}
