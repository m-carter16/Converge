import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";
import { useApiProvider } from "../providers/ApiProvider";
import { useTeamsContext } from "../providers/TeamsContextProvider";
import { UserPhotoResult, UserProfile } from "../types/UserProfile";
import UserWorkingHoursResponse from "../types/UserWorkingHourResponse";

export const useGetUser = (id: string): UseQueryResult<MicrosoftGraph.User> => {
  const { userService } = useApiProvider();
  return useQuery<MicrosoftGraph.User>({
    enabled: !!id && id.length > 0,
    queryKey: [`user-${id}`, id],
    queryFn: async () => userService.getUser(id),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetUserPhoto = (id: string): UseQueryResult<UserPhotoResult> => {
  const { userService } = useApiProvider();
  return useQuery<UserPhotoResult>({
    enabled: !!id && id.length > 0,
    queryKey: [`user-photo-${id}`, id],
    queryFn: async () => userService.getUserPhoto(id),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetWorkGroupPhotos = (users: MicrosoftGraph.User[])
: UseQueryResult<UserPhotoResult, unknown>[] => {
  const { userService } = useApiProvider();
  return useQueries({
    queries: users.map((user: MicrosoftGraph.User) => (
      {
        enabled: !!user.id && user.id.length > 0,
        queryKey: [`user-photo-${user.userPrincipalName}`, user.userPrincipalName],
        queryFn: async () => userService.getUserPhoto(user.userPrincipalName as string),
        staleTime: 1000 * 60 * 60,
      }
    )),
  });
};

export const useGetUsersDetails = (userIds: string[])
: UseQueryResult<MicrosoftGraph.User>[] => {
  const { userService } = useApiProvider();
  return useQueries({
    queries: userIds.map((userId: string) => (
      {
        enabled: !!userId && userId.length > 0,
        queryKey: [`user-${userId}`, userId],
        queryFn: async () => userService.getUser(userId),
        staleTime: 1000 * 60 * 60,
      }
    )),
  });
};

export const useGetUserProfile = (id: string): UseQueryResult<UserProfile> => {
  const { userService } = useApiProvider();
  return useQuery<UserProfile>({
    enabled: !!id && id.length > 0,
    queryKey: [`user-profile-${id}`, id],
    queryFn: async () => userService.getUserProfile(id),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetUserWorkingHours = (id: string): UseQueryResult<UserWorkingHoursResponse> => {
  const { userService } = useApiProvider();
  return useQuery<UserWorkingHoursResponse>({
    enabled: !!id && id.length > 0,
    queryKey: [`user-workinghours-${id}`, id],
    queryFn: async () => userService.getWorkingHours(id),
    staleTime: 1000 * 60 * 60,
  });
};

export const useIsConvergeAdmin = (): UseQueryResult<boolean> => {
  const { settingsService } = useApiProvider();
  const { teamsContext } = useTeamsContext();
  return useQuery<boolean>({
    queryKey: ["userIsConvergeAdmin"],
    queryFn: async () => settingsService.isConvergeAdmin(teamsContext?.userPrincipalName),
  });
};
