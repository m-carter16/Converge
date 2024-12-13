import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import {
  useMutation, UseMutationResult,
  useQuery, UseQueryResult,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import { useApiProvider } from "../providers/ApiProvider";
import MultiUserAvailableTimesResponse from "../types/MultiUserAvailableTimesResponse";
import OfficeTeammate from "../types/OfficeTeammate";
import UserSearchPagedResponse from "../types/UserSearchPagedResponse";

export const useGetPeople = (): UseQueryResult<MicrosoftGraph.User[]> => {
  const { meService } = useApiProvider();
  return useQuery<MicrosoftGraph.User[]>({
    queryKey: ["all-people"],
    queryFn: async () => meService.getPeople(),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetMyList = (): UseQueryResult<MicrosoftGraph.User[]> => {
  const { meService } = useApiProvider();
  return useQuery<MicrosoftGraph.User[]>({
    queryKey: ["my-list"],
    queryFn: async () => meService.getMyList(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useGetMyFollowers = (): UseQueryResult<MicrosoftGraph.User[]> => {
  const { meService } = useApiProvider();
  return useQuery<MicrosoftGraph.User[]>({
    queryKey: ["my-followers"],
    queryFn: async () => meService.getMyFollowers(),
    staleTime: 1000 * 60 * 60,
  });
};

export const useSetMyFollowers = (myFollowers: string[]): UseMutationResult => {
  const { meService } = useApiProvider();
  return useMutation({
    mutationKey: ["my-followers"],
    mutationFn: async () => meService.setMyFollowers(myFollowers),
  });
};

export const useGetMyOrganization = (): UseQueryResult<MicrosoftGraph.User[]> => {
  const { meService } = useApiProvider();
  return useQuery<MicrosoftGraph.User[]>({
    queryKey: ["my-organization"],
    queryFn: async () => meService.getWorkgroup(),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetMyTeammates = (): UseQueryResult<MicrosoftGraph.User[]> => {
  const { meService } = useApiProvider();
  return useQuery<MicrosoftGraph.User[]>({
    queryKey: ["my-teammates"],
    queryFn: async () => meService.getMyTeammates(),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetMyDirectReports = (): UseQueryResult<MicrosoftGraph.User[]> => {
  const { meService } = useApiProvider();
  return useQuery<MicrosoftGraph.User[]>({
    queryKey: ["my-direct-reports"],
    queryFn: async () => meService.getMyDirectReports(),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetOfficeTeammates = (date: Date): UseQueryResult<OfficeTeammate[]> => {
  const { meService } = useApiProvider();
  const day = dayjs.utc(date);
  return useQuery<OfficeTeammate[]>({
    queryKey: [`my-office-teammates-${date}`],
    queryFn: async () => meService.getMyOfficeTeammates(
      day.year(),
      day.month() + 1,
      day.date(),
    ),
    staleTime: 1000 * 60 * 60,
  });
};

export const useSearchUser = (searchQuery: string)
: UseQueryResult<UserSearchPagedResponse> => {
  const { userService } = useApiProvider();
  return useQuery<UserSearchPagedResponse>({
    queryKey: [`searchUsers ${searchQuery}`],
    queryFn: async () => userService.searchUsers(searchQuery),
  });
};

export const useGetUserAvalabilityTimes = (
  users : string[],
  day: dayjs.Dayjs,
  scheduleStart :Date,
  scheduleEnd: Date,
)
: UseQueryResult<MultiUserAvailableTimesResponse> => {
  const { userService } = useApiProvider();
  const dateString = day.format("ddd MMM D YYYY");
  return useQuery<MultiUserAvailableTimesResponse>({
    queryKey: [`availableTimes-${users}`, dateString],
    queryFn: async () => userService.getMultiUserAvailabilityTimes(users,
      day.year(), day.month() + 1, day.date(),
      scheduleStart,
      scheduleEnd),
    staleTime: 1000 * 60 * 5,
  });
};
