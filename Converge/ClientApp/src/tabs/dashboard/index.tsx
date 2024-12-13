import React from "react";

import { Box, Flex } from "@fluentui/react-northstar";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekday from "dayjs/plugin/weekday";
import DisplayBox from "../home/DisplayBox";
import MyLocationGallery from "./components/MyLocationGallery";
import MyOpportunities from "./components/MyOpportunities";
import { useGetMyPrediction } from "../../hooks/usePrediction";
import LocationType from "../../types/LocationType";
import { useTeamsContext } from "../../providers/TeamsContextProvider";
import { useGetUser } from "../../hooks/useUserDetails";
import OpportunityAlert from "./components/OpportunityAlert";
import { useGetNotificationPreferences } from "../../hooks/useConvergeSettings";
import { useGetMyOpportunities } from "../../hooks/useMyOpportunities";
import Opportunity from "../../types/Opportunity";

dayjs.extend(weekOfYear);
dayjs.extend(weekday);

const OpportunityDashboard: React.FC = () => {
  const today = new Date();
  const [week, setWeek] = React.useState(dayjs().week());
  const [year, setYear] = React.useState(dayjs().year());
  const tomorrow = dayjs(today).add(1, "day").toDate();
  const { teamsContext } = useTeamsContext();
  const { data: prediction, isLoading } = useGetMyPrediction(today);
  const { data: user } = useGetUser(teamsContext?.userPrincipalName ?? "");
  const { data: notificationPreferences } = useGetNotificationPreferences();
  const { data: opportunities } = useGetMyOpportunities(tomorrow);
  const [alerts, setAlerts] = React.useState<Opportunity[]>([]);

  React.useEffect(() => {
    if (opportunities && opportunities?.length > 0) {
      if (notificationPreferences?.inApp) {
        setAlerts(opportunities.filter((i) => i.dismissed === false));
      }
    }
  }, [opportunities]);

  return (
    <>
      {
        alerts && alerts.length > 0 ? (
          <OpportunityAlert
            opportunities={opportunities ?? []}
            date={tomorrow}
          />
        ) : null
      }
      <Box
        styles={{
          display: "grid",
          padding: "1em 1.5em",
          gridTemplateColumns: "1fr",
          gridTemplateAreas: "'OpportunityDashboard'",
          height: "fit-content",
        }}
      >
        <DisplayBox
          headerContent={`Let’s help you connect today, ${user?.displayName ?? ""}`}
          descriptionContent="Improve team connections by spending time with people in your network"
          gridArea="OpportunityDashboard"
        >
          <Flex gap="gap.medium">
            <Box style={{ width: "80%" }}>
              {prediction?.name !== LocationType.Hybrid && prediction?.name !== LocationType.Remote
                && prediction?.name !== LocationType.ScheduledOff
                && !isLoading && <MyOpportunities prediction={prediction?.name ?? ""} />}
              <MyLocationGallery
                week={week}
                year={year}
                setWeek={(wk) => setWeek(wk)}
                setYear={(yr) => setYear(yr)}
              />
            </Box>
          </Flex>
        </DisplayBox>
      </Box>
    </>
  );
};

export default OpportunityDashboard;
