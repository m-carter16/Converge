import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useApiProvider } from "../providers/ApiProvider";
import Settings from "../types/Settings";

const useGetAppSettings = (): UseQueryResult<Settings> => {
  const { settingsService } = useApiProvider();
  return useQuery<Settings>({
    queryKey: ["appSettings"],
    queryFn: async () => settingsService.getAppSettings(),
  });
};

export default useGetAppSettings;
