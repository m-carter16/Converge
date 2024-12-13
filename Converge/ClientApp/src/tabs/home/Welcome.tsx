// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import {
  Box, Button, Form, FormButton, FormLabel, FormField, Input, Alert,
} from "@fluentui/react-northstar";
import dayjs from "dayjs";
import WelcomeBanner from "./WelcomeBanner";
import { logEvent } from "../../utilities/LogWrapper";
import {
  DESCRIPTION, ImportantActions, IMPORTANT_ACTION, UISections, UI_SECTION, USER_INTERACTION,
} from "../../types/LoggerTypes";
import InitialLoader from "../../InitialLoader";
import WelcomeStyles from "./styles/WelcomeStyles";
import BuildingPicker from "../../utilities/BuildingPicker";
import { useGetBuildingsByName } from "../../hooks/useBuildings";
import { LocationPreferences } from "../../types/ConvergeSettings";
import LocationType from "../../types/LocationType";
import BuildingBasicInfo from "../../types/BuildingBasicInfo";
import { useSetupNewUser } from "../../hooks/useConvergeSettings";
import useGetAppSettings from "../../hooks/useAppSettings";

interface WelcomeProps {
  setDefaultsSaved: (val: boolean) => void
}

const Welcome: React.FC<WelcomeProps> = (props) => {
  const { setDefaultsSaved } = props;
  const [zipCode, setZipCode] = useState("");
  const [selectedBuilding, setSelectedBuilding] = React.useState<BuildingBasicInfo | undefined>(
    undefined,
  );
  const [locationPreferences, setLocationPreferences] = useState<LocationPreferences>({});
  const [getStarted, setGetStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isErr, setIsErr] = useState(false);
  const classes = WelcomeStyles();
  const { data: buildings } = useGetBuildingsByName();
  const { data: appSettings } = useGetAppSettings();
  // const { refetch, isFetching } = useGetConvergeSettings();
  const { mutate } = useSetupNewUser();

  const handleGetStartedButton = () => {
    setGetStarted(true);
    logEvent(USER_INTERACTION, [
      { name: UI_SECTION, value: UISections.Welcome },
      { name: DESCRIPTION, value: "submit_zipcode" },
    ]);
  };

  const initialLocationPreferences = {
    defaultLocation: LocationType.Hybrid,
    zipCode,
    defaultBuilding: "",
    monday: LocationType.InOffice,
    tuesday: LocationType.InOffice,
    wednesday: LocationType.InOffice,
    thursday: LocationType.InOffice,
    friday: LocationType.InOffice,
    saturday: LocationType.ScheduledOff,
    sunday: LocationType.ScheduledOff,
  };

  const initialNotificationPreferences = {
    email: false,
    teams: false,
    inApp: false,
  };

  const updateDefaultBuilding = (bldg: BuildingBasicInfo | undefined) => {
    const campusUpn = bldg?.identity;
    setLocationPreferences(initialLocationPreferences);
    const newLocationSettings = {
      ...locationPreferences,
      defaultBuilding: campusUpn,
    };
    setLocationPreferences(newLocationSettings);
  };

  const handleFormSubmission = () => {
    setLoading(true);
    setIsErr(false);
    logEvent(USER_INTERACTION, [
      { name: "didSubmitZipCode", value: (!!zipCode).toString() },
      { name: UI_SECTION, value: UISections.Welcome },
      { name: DESCRIPTION, value: "zip_code_submit" },
    ]);

    const newSettings = {
      isConvergeUser: true,
      zipCode,
      locationPreferences: { ...locationPreferences, zipCode },
      notificationPreferences: initialNotificationPreferences,
      convergeInstalledDate: dayjs().toISOString(),
    };
    mutate(newSettings, {
      onSuccess: () => {
        setDefaultsSaved(true);

        if (zipCode && zipCode !== "") {
          logEvent(USER_INTERACTION, [
            { name: IMPORTANT_ACTION, value: ImportantActions.AddZipCode },
          ]);
        }

        if (appSettings?.teamsAppId) {
          microsoftTeams.pages.navigateToApp({
            appId: appSettings?.teamsAppId,
            pageId: "settings",
          });
        }
        setLoading(false);
      },
      onError: () => {
        setIsErr(true);
        setLoading(false);
      },
    });
  };

  const descriptiontext1 = "To identify the best connection opportunities, Converge needs some basic location information. This is so the app can provide you with relevant connection suggestions based on what colleagues and meeting spaces, and offices are closest to you. ";
  const descriptiontext2 = "Converge doesn't share your exact location. Your teammates will only see that you are remote, at an office, or out of office.";

  React.useEffect(() => {
    const bldg = buildings?.buildingsList.find((b) => (
      b.identity === locationPreferences.defaultBuilding
      || b.displayName === locationPreferences.defaultBuilding
    ));
    setSelectedBuilding(bldg);
  }, [buildings, getStarted]);

  return (
    <>
      {
        getStarted ? (
          <Box className={classes.root}>
            {
              loading
                ? (<InitialLoader />)
                : (
                  <Box className={classes.getStarted}>
                    <h1 className={classes.remoteText}>Remote work</h1>
                    <p className={classes.description}>{descriptiontext1}</p>
                    <p className={classes.description}>{descriptiontext2}</p>
                    <Box>
                      <Form onSubmit={handleFormSubmission}>
                        <p className={classes.contentText}>
                          Where are you most likely to work remote from?
                        </p>
                        <FormField>
                          <FormLabel
                            htmlFor="zipcode"
                            id="zipcode"
                            className={classes.zipCode}
                          >
                            Zipcode
                          </FormLabel>
                          <Input
                            inverted
                            name="zipcode"
                            aria-labelledby="zipcode message-id"
                            id="zipcode"
                            type="text"
                            className={classes.zipInput}
                            defaultValue={zipCode}
                            value={zipCode}
                            onChange={(e, inputProps) => {
                              if (inputProps) { setZipCode(inputProps?.value); }
                            }}
                          />
                        </FormField>
                        <p className={classes.contentText}>
                          What building are you most likely to work from?
                        </p>
                        <FormField>
                          <FormLabel
                            htmlFor="defaultBuilding"
                            id="defaultBuilding"
                            className={classes.zipCode}
                          >
                            Building
                          </FormLabel>
                          <BuildingPicker
                            headerTitle="Recent buildings"
                            handleDropdownChange={updateDefaultBuilding}
                            locationBuildingName={selectedBuilding?.displayName}
                            width="320px"
                            backgroundColor="#FFFFFF"
                            marginContent="10px"
                            value={selectedBuilding}
                            placeholderTitle="Select a building"
                            buttonTitle="Show more"
                            maxHeight="260px"
                            onWelcome
                          />
                        </FormField>
                        {isErr && <Alert danger content="There was a problem setting up your account. Please try again." />}
                        <Box className={classes.btnWrapper}>
                          <FormButton
                            content="Done"
                            primary
                            className={classes.formBtn}
                            loading={loading}
                          />
                        </Box>
                      </Form>
                    </Box>
                  </Box>
                )
            }
          </Box>
        ) : (
          <Box className={classes.bannerBox}>
            <WelcomeBanner />
            <h1 className={classes.remoteText}>Welcome to Converge! We’re glad you’re here.</h1>
            <p className={classes.convergeDescription}>
              Converge is your tool to make the most out of going into the office.
            </p>
            <Button
              content="Get started"
              primary
              className={classes.getStartedBtn}
              styles={{ padding: "12px 0" }}
              onClick={handleGetStartedButton}
            />
          </Box>
        )
      }
    </>
  );
};
export default Welcome;
