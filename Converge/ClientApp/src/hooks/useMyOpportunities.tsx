import {
  useMutation,
  UseMutationResult,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import { useApiProvider } from "../providers/ApiProvider";
import Opportunity from "../types/Opportunity";

export interface mutateOpportunitiesVariables {
  date: Date;
  opportunities: Opportunity[];
}

export const useGetMyOpportunities = (date: Date): UseQueryResult<Opportunity[]> => {
  const { meService } = useApiProvider();
  const day = dayjs.utc(date);
  const dateString = date.toDateString();
  return useQuery<Opportunity[]>({
    queryKey: [`my-opportunities-${dateString}`],
    queryFn: async () => meService.getMyOpportunities(
      day.year(),
      day.month() + 1,
      day.date(),
    ),
  });
};

export const useUpdateMyOpportunities = ():
UseMutationResult<void, unknown, mutateOpportunitiesVariables, unknown> => {
  const { meService } = useApiProvider();
  return useMutation({
    mutationFn: async ({ date, opportunities }: mutateOpportunitiesVariables) => {
      const day = dayjs.utc(date);
      meService.updateMyOpportunities(
        day.year(),
        day.month() + 1,
        day.date(),
        opportunities,
      );
    },
  });
};
