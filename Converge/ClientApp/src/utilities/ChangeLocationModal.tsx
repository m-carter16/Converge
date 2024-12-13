// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  Dialog, Flex, Provider, Box, Text, Button,
} from "@fluentui/react-northstar";
import { CloseIcon } from "@fluentui/react-icons-northstar";
import React, { useState } from "react";
import dayjs from "dayjs";
import { makeStyles } from "@fluentui/react-theme-provider";
import BuildingBasicInfo from "../types/BuildingBasicInfo";
import { logEvent } from "../utilities/LogWrapper";
import {
  UI_SECTION, UISections, USER_INTERACTION, DESCRIPTION, IMPORTANT_ACTION, ImportantActions,
} from "../types/LoggerTypes";
import BuildingPicker from "./BuildingPicker";
import UserPredictedLocationRequest from "../types/UserPredictedLocationRequest";
import { useGetMyPrediction, useUpdateMyPrediction } from "../hooks/usePrediction";

const ChangeLocationModalStyles = makeStyles(() => ({
  triggerBtn: {
    "& .ui-button__content": {
      fontSize: "12px",
      fontWeight: "normal",
    },
  },
  contentWrapper: {
    borderBottom: "1px solid #E6E6E6",
    paddingBottom: "26px",
  },
  description: {
    marginBottom: "16px !important",
    fontSize: "14px",
  },
  location: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "8px !important",
  },
  locationText: {
    marginBottom: "8px !important",
  },
  dropBox: {
    "& .ui-button": {
      width: "150px",
      borderRadius: "4px",
      backgroundColor: "rgb(245, 245, 245)",
      border: "0px",
      boxShadow: "none",
    },
  },
}));

interface Props {
  buildings: BuildingBasicInfo[];
  date: Date;
  recommendation?: string;
  refreshRecommendation: () => void;
}

const ChangeLocationModal: React.FC<Props> = (props) => {
  const {
    date,
    refreshRecommendation,
  } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const classes = ChangeLocationModalStyles();
  const { mutateAsync } = useUpdateMyPrediction();
  const { data: prediction } = useGetMyPrediction(date);

  const onConfirmbutton = () => {
    setLoading(true);
    logEvent(USER_INTERACTION, [
      { name: UI_SECTION, value: UISections.LocationChangeModalHome },
      { name: DESCRIPTION, value: "confirm_converge_prediction" },
    ]);
  };

  const updateDefaultBuilding = (bldg: BuildingBasicInfo | undefined) => {
    const newPrediction: UserPredictedLocationRequest = {
      year: dayjs.utc(date).year(),
      month: dayjs.utc(date).month() + 1,
      day: dayjs.utc(date).date(),
      userPredictedLocation: {
        campusUpn: bldg?.identity,
      },
    };

    mutateAsync(newPrediction, {
      onSuccess() {
        logEvent(USER_INTERACTION, [
          { name: IMPORTANT_ACTION, value: ImportantActions.ChangeConvergePrediction },
        ]);
        refreshRecommendation();
        setOpen(false);
        setLoading(false);
      },
    });
  };

  return (
    <Provider
      theme={{
        componentVariables: {
          Dialog: {
            rootWidth: "612px",
            headerFontSize: "18px",
          },
        },
      }}
    >
      <Dialog
        open={open}
        onOpen={() => {
          logEvent(USER_INTERACTION, [
            { name: UI_SECTION, value: UISections.LocationChangeModalHome },
            { name: DESCRIPTION, value: "open_change_converge_prediction" },
          ]);
          setOpen(true);
        }}
        onCancel={() => {
          logEvent(USER_INTERACTION, [
            { name: UI_SECTION, value: UISections.LocationChangeModalHome },
            { name: DESCRIPTION, value: "close_change_converge_prediction" },
          ]);
          setOpen(false);
        }}
        onConfirm={onConfirmbutton}
        confirmButton={{
          content: "Confirm",
          loading,
        }}
        cancelButton="Cancel"
        header="Change your location"
        headerAction={{
          icon: <CloseIcon />,
          title: "Close",
          onClick: () => {
            setOpen(false);
            logEvent(USER_INTERACTION, [
              { name: UI_SECTION, value: UISections.LocationChangeModalHome },
              { name: DESCRIPTION, value: "close_change_converge_prediction" },
            ]);
          },
        }}
        trigger={(
          <Button
            className={classes.triggerBtn}
            text
            content="Change location"
          />
        )}
        content={(
          <Flex
            column
            gap="gap.small"
            className={classes.contentWrapper}
          >
            <Box as="p" className={classes.description}>
              Converge predicts where you’re going to be working from any given day.
              By changing your location, you’re helping us to make better predictions later.
            </Box>
            <Box as="h2" className={classes.location}>
              Where are you working from on
              {" "}
              {dayjs(date).format("dddd, MMMM D")}
              ?
            </Box>
            <Text content="Location" className={classes.locationText} />
            <Box className={classes.dropBox}>
              <BuildingPicker
                headerTitle="Recent buildings"
                handleDropdownChange={updateDefaultBuilding}
                locationBuildingName=""
                width="220px"
                marginContent="0"
                value={{
                  displayName: prediction?.name ?? "",
                  identity: prediction?.uri ?? "",
                }}
                placeholderTitle="Select building"
                buttonTitle="Show more"
                maxHeight="260px"
              />
            </Box>
          </Flex>
        )}
      />
    </Provider>
  );
};

export default ChangeLocationModal;
