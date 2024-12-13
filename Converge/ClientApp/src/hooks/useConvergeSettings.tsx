import {
  useMutation, UseMutationResult,
  useQuery, UseQueryResult,
} from "@tanstack/react-query";
import { useApiProvider } from "../providers/ApiProvider";
import { ConvergeSettings, LocationPreferences, NotificationPreferences } from "../types/ConvergeSettings";

export const useGetConvergeSettings = (): UseQueryResult<ConvergeSettings | null> => {
  const { meService } = useApiProvider();
  return useQuery<ConvergeSettings | null>({
    queryKey: ["userSettings"],
    queryFn: async () => meService.getSettings(),
  });
};

export const useGetLocationPreferences = (): UseQueryResult<LocationPreferences | null> => {
  const { meService } = useApiProvider();
  return useQuery<LocationPreferences | null>({
    queryKey: ["location-preferences"],
    queryFn: async () => meService.getLocationPreferences(),
  });
};

export const useGetNotificationPreferences = (): UseQueryResult<NotificationPreferences | null> => {
  const { meService } = useApiProvider();
  return useQuery<NotificationPreferences | null>({
    queryKey: ["notification-preferences"],
    queryFn: async () => meService.getNotificationPreferences(),
  });
};

export const useSetupNewUser = ():
  UseMutationResult<any, unknown, ConvergeSettings, unknown> => {
  const { meService } = useApiProvider();
  return useMutation({
    mutationFn: async (settings: ConvergeSettings) => meService.setupNewUser(settings),
  });
};

export const useUpdateConvergeSettings = ():
  UseMutationResult<any, unknown, ConvergeSettings, unknown> => {
  const { meService } = useApiProvider();
  return useMutation({
    mutationFn: async (settings: ConvergeSettings) => meService.setSettings(settings),
  });
};
