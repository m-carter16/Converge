// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";
import { Box, Loader } from "@fluentui/react-northstar";
import { useBoolean } from "@fluentui/react-hooks";
import BookWorkspace from "./BookWorkspace";
import ConnectTeammates from "./ConnectTeammates";
import Welcome from "./Welcome";
import { TeammateFilterProvider } from "../../providers/TeammateFilterProvider";
import { PlaceContextProvider } from "../../providers/PlaceFilterProvider";
import NPSDialog from "./components/NPSDialog";
import UnknownZipcodeAlert from "./UnknownZipcodeAlert";
import OpportunityDashboard from "../dashboard";
import { useGetAdminSettings } from "../../hooks/useAdminSettings";
import { LocationPreferences, NotificationPreferences } from "../../types/ConvergeSettings";
import { useGetConvergeSettings, useUpdateConvergeSettings } from "../../hooks/useConvergeSettings";
import LocationType from "../../types/LocationType";

const Home: React.FC = () => {
  const {
    data: convergeSettings,
    isLoading,
    isFetching,
    refetch,
  } = useGetConvergeSettings();
  const { data: adminSettings } = useGetAdminSettings();
  const { mutate } = useUpdateConvergeSettings();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [checked, { toggle }] = useBoolean(true);
  const [defaultsSaved, setDefaultsSaved] = React.useState(false);

  const templateAreas = adminSettings?.workspaceEnabled
    ? "'ConnectTeammates ConnectTeammates ConnectTeammates BookWorkspace'"
    : "'ConnectTeammates ConnectTeammates ConnectTeammates ConnectTeammates'";

  React.useEffect(() => {
    if (convergeSettings) {
      const updatedPreferences: LocationPreferences = {
        ...convergeSettings.locationPreferences,
      };
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      days.forEach((day) => {
        if (updatedPreferences[day] === null) {
          updatedPreferences[day] = (day === "saturday" || day === "sunday") ? LocationType.ScheduledOff : LocationType.Remote;
        }
      });
      const updatedNotification: NotificationPreferences = {
        ...convergeSettings.notificationPreferences,
      };
      updatedNotification.email === null ? false : updatedNotification.email;
      updatedNotification.teams === null ? false : updatedNotification.teams;
      updatedNotification.inApp === null ? false : updatedNotification.inApp;

      const newSettings = {
        ...convergeSettings,
        locationPreferences: updatedPreferences,
        notificationPreferences: updatedNotification,
      };
      mutate(newSettings);
    }
  }, [convergeSettings]);

  React.useEffect(() => {
    refetch();
  }, [defaultsSaved]);

  return (
    <>
      {isLoading || isFetching
        ? (<Loader />)
        : (
          <>
            {convergeSettings?.isConvergeUser ? (
              <>
                {!convergeSettings?.zipCode && (
                  <UnknownZipcodeAlert />
                )}
                {/* <Box
            styles={{
              display: "grid",
              padding: "1em 1.5em",
            }}
          >
            <Checkbox
              checked={checked}
              label={checked ? "Hide Dashboard" : "Show Dashboard"}
              toggle
              onClick={toggle}
            />
          </Box> */}
                {checked ? (
                  <TeammateFilterProvider>
                    <OpportunityDashboard />
                  </TeammateFilterProvider>
                ) : (
                  <Box
                    styles={{
                      display: "grid",
                      padding: "1em 1.5em",
                      gridTemplateColumns: "1fr 1fr 1fr 362px",
                      gridTemplateAreas: templateAreas,
                      "@media (max-width: 1366px)": {
                        "grid-template-columns": "1fr",
                        "grid-template-areas": `'ConnectTeammates'
                  'BookWorkspace'`,
                      },
                      gridGap: "8px",
                    }}
                  >
                    <TeammateFilterProvider>
                      <ConnectTeammates
                        key="ConnectTeammates"
                      />
                    </TeammateFilterProvider>
                    <PlaceContextProvider>
                      {adminSettings?.workspaceEnabled ? <BookWorkspace key="BookWorkspace" /> : null}
                    </PlaceContextProvider>
                    <NPSDialog />
                  </Box>
                )}
              </>
            ) : (
              <Welcome setDefaultsSaved={setDefaultsSaved} />
            )}
          </>
        )}
    </>
  );
};

export default Home;
