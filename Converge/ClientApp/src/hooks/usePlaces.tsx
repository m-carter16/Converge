import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useApiProvider } from "../providers/ApiProvider";
import { PlaceType } from "../types/ExchangePlace";
import { IExchangePlacesResponse } from "../types/IExchangePlacesResponse";

interface IGetBuildingPlacesRequestParams {
  topCount?: number;
  skipToken?: string | null | undefined;
  hasAudio?: boolean;
  hasVideo?: boolean;
  hasDisplay?: boolean;
  isAccessbile?: boolean;
  displayNameSearchString?: string;
  capacity?: number;
}

const useGetBuildingPlaces = (
  buildingUpn: string,
  placeType: PlaceType,
  params?: IGetBuildingPlacesRequestParams,
): UseQueryResult<IExchangePlacesResponse> => {
  const { buildingService } = useApiProvider();
  return useQuery<IExchangePlacesResponse>({
    queryKey: [
      `places-${buildingUpn}-${placeType}`,
      [buildingUpn, placeType, params],
    ],
    queryFn: async () => buildingService.getBuildingPlaces(
      buildingUpn,
      placeType,
      params,
    ),
    staleTime: 1000 * 60 * 60,
  });
};

export default useGetBuildingPlaces;
