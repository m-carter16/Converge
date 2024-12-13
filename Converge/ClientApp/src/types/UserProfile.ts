// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ApiPresence from "./ApiPresence";

export interface UserProfile {
  userPhoto: [];
  presence: ApiPresence;
}

export interface UserPhotoResult {
  id: string;
  userPhoto: string | null;
}
