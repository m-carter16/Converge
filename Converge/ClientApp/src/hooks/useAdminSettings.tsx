import {
  useMutation, UseMutationResult,
  useQuery, UseQueryResult,
} from "@tanstack/react-query";
import { useApiProvider } from "../providers/ApiProvider";
import AdminSettings from "../types/AdminSettings";

export const useGetAdminSettings = (): UseQueryResult<AdminSettings> => {
  const { settingsService } = useApiProvider();
  return useQuery<AdminSettings>({
    queryKey: ["adminSettings"],
    queryFn: async () => settingsService.getAdminSettings(),
  });
};

export const useSetAdminSettings = ():
UseMutationResult<any, unknown, AdminSettings, unknown> => {
  const { settingsService } = useApiProvider();
  return useMutation({
    mutationFn: async (adminSettings: AdminSettings) => (
      settingsService.setAdminSettings(adminSettings)),
  });
};
