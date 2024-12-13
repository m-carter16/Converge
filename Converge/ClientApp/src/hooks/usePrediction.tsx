import {
  useMutation, UseMutationResult,
  useQueries,
  useQuery, UseQueryResult,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import { useApiProvider } from "../providers/ApiProvider";
import UserLocation from "../types/UserLocation";
import UserPredictedLocationRequest from "../types/UserPredictedLocationRequest";
import UserWeeklyLocations from "../types/UserWeeklyLocations";

export const useGetMyPrediction = (date: Date): UseQueryResult<UserLocation> => {
  const { meService } = useApiProvider();
  const dateString = date.toDateString();
  return useQuery<UserLocation>({
    queryKey: [`my-location-${dateString}`],
    queryFn: async () => meService.getMyLocation(
      date.getFullYear(), date.getMonth() + 1, date.getDate(),
    ),
    staleTime: 1000 * 60 * 60,
  });
};

export const useUpdateMyPrediction = ():
UseMutationResult<any, unknown, UserPredictedLocationRequest, unknown> => {
  const { meService } = useApiProvider();
  return useMutation({
    mutationFn: async (prediction: UserPredictedLocationRequest) => (
      meService.updateMyPrediction(prediction)),
  });
};

export const useGetUserPrediciton = (upn: string, date: Date): UseQueryResult<UserLocation> => {
  const { userService } = useApiProvider();
  const day = dayjs.utc(date);
  const dateString = date.toDateString();
  return useQuery<UserLocation>({
    enabled: !!upn && upn.length > 0,
    queryKey: [`user-location-${upn}`, [upn, dateString]],
    queryFn: async () => userService.getLocation(upn, day.year(), day.month() + 1, day.date()),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetWeeklyLocations = (id: string, week: number, year: number)
: UseQueryResult<UserWeeklyLocations> => {
  const { userService } = useApiProvider();
  return useQuery<UserWeeklyLocations>({
    enabled: !!id && id.length > 0,
    queryKey: [`weekly-locations-${id}-${week}`],
    queryFn: async () => userService.getWeeklyLocations(id, week, year),
  });
};

export const useGetMyWeeklyLocations = (week: number, year: number)
: UseQueryResult<UserWeeklyLocations> => {
  const { meService } = useApiProvider();
  return useQuery<UserWeeklyLocations>({
    queryKey: [`my-weekly-locations-${week}`],
    queryFn: async () => meService.getMyWeeklyLocations(week, year),
  });
};

export const useGetUsersPrediciton = (upns: string[], date: Date)
: UseQueryResult<UserLocation, unknown>[] => {
  const { userService } = useApiProvider();
  const day = dayjs.utc(date);
  const dateString = date.toDateString();
  return useQueries({
    queries: upns.map((userUpn: string) => (
      {
        enabled: !!userUpn && userUpn.length > 0,
        queryKey: [`user-location-${userUpn}`, [userUpn, dateString]],
        // eslint-disable-next-line max-len
        queryFn: async () => userService.getLocation(userUpn, day.year(), day.month() + 1, day.date()),
        staleTime: 1000 * 60 * 60,
      }
    )),
  });
};
