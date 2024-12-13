import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useApiProvider } from "../providers/ApiProvider";
import BuildingBasicInfo from "../types/BuildingBasicInfo";
import UpcomingBuildingsResponse from "../types/UpcomingBuildingsResponse";

export const useGetBuildingsByDistance = (geoCoordinates: string, distance: number):
  UseQueryResult<UpcomingBuildingsResponse> => {
  const { buildingService } = useApiProvider();
  return useQuery<UpcomingBuildingsResponse>({
    queryKey: ["buildingsByDistance", [geoCoordinates, distance]],
    queryFn: async () => buildingService.getBuildingsByDistance(geoCoordinates, distance),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetBuildingsByName = (): UseQueryResult<UpcomingBuildingsResponse> => {
  const { buildingService } = useApiProvider();
  return useQuery<UpcomingBuildingsResponse>({
    queryKey: ["buildingsByName"],
    queryFn: async () => buildingService.getBuildingsByName(),
    staleTime: 1000 * 60 * 60,
  });
};

export const useGetRecentBuildings = (): UseQueryResult<BuildingBasicInfo[]> => {
  const { meService } = useApiProvider();
  return useQuery<BuildingBasicInfo[]>({
    queryKey: ["recentBuildings"],
    queryFn: async () => meService.getRecentBuildingsBasicDetails(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useGetTotalBuildingCount = (): UseQueryResult<number> => {
  const { buildingService } = useApiProvider();
  return useQuery<number>({
    queryKey: ["totalbuildingCount"],
    queryFn: async () => buildingService.getBuildingsByName()
      .then((res) => res.buildingsList.length),
    staleTime: 1000 * 60 * 60,
  });
};
