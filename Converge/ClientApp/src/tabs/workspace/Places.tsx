// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from "react";
import {
  Alert,
  Box, Button, Text, ErrorIcon, Flex, Form, Loader, FormField, FormLabel,
} from "@fluentui/react-northstar";
import dayjs from "dayjs";
import DisplayBox from "../home/DisplayBox";
import DateTimeFilter from "./components/DateTimeFilter";
import PlaceTypeFilter from "./components/PlaceTypeFilter";
import FeatureFilter from "./components/FeatureFilter";
import CapacityFilter from "./components/CapacityFilter";
import { useProvider as PlaceProvider } from "../../providers/PlaceFilterProvider";
import { deserializeSubEntityId } from "../../utilities/deepLink";
import {
  DESCRIPTION, UISections, UI_SECTION, USER_INTERACTION,
} from "../../types/LoggerTypes";
import PlacesStyles from "./styles/PlacesStyles";
import { useTeamsContext } from "../../providers/TeamsContextProvider";
import BuildingPlaces from "./components/BuildingPlaces";
import { logEvent } from "../../utilities/LogWrapper";
import CustomizedPlaceCollectionAccordian from "./components/CustomizedPlaceCollectionAccordian";
import ExchangePlace, { PlaceType } from "../../types/ExchangePlace";
import RepeatingBox from "./components/RepeatingBox";
import PlaceCard from "./components/PlaceCard";
import BuildingPicker from "../../utilities/BuildingPicker";
import { useGetAdminSettings } from "../../hooks/useAdminSettings";
import BuildingBasicInfo from "../../types/BuildingBasicInfo";
import { useGetUsersDetails } from "../../hooks/useUserDetails";
import { useGetConvergeSettings } from "../../hooks/useConvergeSettings";
import { useGetBuildingsByDistance, useGetBuildingsByName } from "../../hooks/useBuildings";

interface Props {
  favoriteCampuses: ExchangePlace[];
  isError:boolean;
}

const Places: React.FC<Props> = (props) => {
  const {
    favoriteCampuses,
    isError,
  } = props;
  const {
    state, updateLocation, updateStartDate, updateEndDate,
  } = PlaceProvider();
  const [err, setErr] = useState<boolean>(isError);
  const classes = PlacesStyles();
  const { teamsContext } = useTeamsContext();
  const [skipTokenString, setSkipTokenString] = useState<string>("");
  const { data: adminSettings } = useGetAdminSettings();
  const { data: userSettings } = useGetConvergeSettings();
  const [isNavigation, setIsNavigation] = useState<boolean>(false);
  const [selectedBuilding, setSelectedBuilding] = useState({
    displayName: "",
    identity: "",
  });
  const [usersUid, setUsersUid] = React.useState<string[]>([]);
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const userResult = useGetUsersDetails(usersUid) ?? [];
  const [placeType, setPlaceType] = React.useState<PlaceType>(PlaceType.Room);
  const {
    data: buildings,
    isLoading: buildingsLoading,
  } = userSettings?.geoCoordinates
    ? useGetBuildingsByDistance(`${userSettings?.geoCoordinates.latitude},${userSettings?.geoCoordinates.longitude}`, 25)
    : useGetBuildingsByName();

  const getPlaceType = (place: PlaceType) => {
    setPlaceType(place);
  };

  const refreshPlace = () => {
    window.location.reload();
  };

  const onSkipToken = (skipToken:string) => {
    setSkipTokenString(skipToken);
  };

  const handleBuildingChange = (bldg: BuildingBasicInfo | undefined) => {
    const campusUpn = bldg?.identity;
    updateLocation(campusUpn);
  };

  useEffect(() => {
    if (teamsContext?.subEntityId) {
      const subEntityId = deserializeSubEntityId(teamsContext.subEntityId);
      Object.keys(subEntityId).forEach((key) => {
        if (key === "location") {
          const bldg = buildings?.buildingsList.find((b) => (
            b.identity === subEntityId[key]
            || b.displayName === subEntityId[key]
          ));
          handleBuildingChange(bldg);
          bldg ? setSelectedBuilding(bldg) : null;
          updateLocation(subEntityId[key]);
        }
        if (key === "start") {
          const startTime = dayjs(subEntityId.start);
          setStart(startTime.format("h:mm A"));
          updateStartDate(startTime);
        }
        if (key === "end") {
          const endTime = dayjs(subEntityId.end);
          setEnd(endTime.format("h:mm A"));
          updateEndDate(endTime);
        }
        if (key === "users") {
          const usersParam = subEntityId[key];
          const usersArray = usersParam.split("!").map((user) => user);
          setUsersUid(usersArray);
        }
      });
      setIsNavigation(true);
    }
  }, [buildings, teamsContext]);

  return (
    <DisplayBox
      descriptionContent="Find somewhere to get things done"
      headerContent="Places"
      gridArea="Places"
    >
      {err && (
        <>
          <Alert
            danger
            icon={<ErrorIcon />}
            onVisibleChange={() => setErr(false)}
            dismissible
            dismissAction={{ "aria-label": "close" }}
            content={(
              <Flex>
                <Text
                  content="Something went wrong with your search."
                  styles={{
                    minWidth: "0px !important",
                    paddingTop: "0.4rem",
                  }}
                />
                <Button
                  content={(
                    <Text
                      content="Try again"
                      styles={{
                        minWidth: "0px !important",
                        paddingTop: "0.4rem",
                      }}
                    />
                  )}
                  text
                  onClick={() => {
                    refreshPlace();
                    logEvent(USER_INTERACTION, [
                      { name: UI_SECTION, value: UISections.Places },
                      { name: DESCRIPTION, value: "refreshPlace" },
                    ]);
                  }}
                  color="red"
                  styles={{
                    minWidth: "0px !important", paddingTop: "0.2rem", textDecoration: "UnderLine", color: "rgb(196, 49, 75)",
                  }}
                />
              </Flex>
            )}
          />
        </>
      )}
      <Box className={classes.headerBox}>
        { isNavigation ? (
          <Form>
            <FormField>
              <FormLabel htmlFor="users" id="users" styles={{ fontSize: "12px", marginBottom: "8px !important" }}>Users</FormLabel>
              <Box
                className={classes.usersBox}
              >
                <Text
                  className={classes.usersTextField}
                  content={userResult
                    .filter((value) => value?.status === "success")
                    .map((result) => result?.data?.displayName ?? "")
                    .join(", ")}
                />
              </Box>
            </FormField>
          </Form>
        ) : null}
        <Form>
          <Box
            styles={{
              maxWidth: "1175px",
              display: "flex",
              paddingBottom: "1.4em",
              flexWrap: "wrap",
              justifyContent: "space-between",
              "@media (max-width: 968px)": {
                "& .ui-form__field": {
                  margin: "1em 0",
                  width: "50%",
                },
              },
            }}
          >
            <FormField>
              <FormLabel htmlFor="location" id="location" styles={{ fontSize: "12px", marginBottom: "8px !important" }}>Location</FormLabel>
              <Box className={classes.dropBox}>
                <BuildingPicker
                  headerTitle="Recent buildings"
                  handleDropdownChange={handleBuildingChange}
                  locationBuildingName={selectedBuilding.displayName}
                  width="195px"
                  marginContent="10px"
                  value={selectedBuilding}
                  placeholderTitle="Select a building"
                  buttonTitle="Show more"
                  maxHeight="260px"
                  onWelcome={false}
                  onLocationCard={false}
                />
              </Box>
            </FormField>
            <DateTimeFilter start={start} end={end} />
            {adminSettings?.workspaceEnabled
              ? (
                <PlaceTypeFilter
                  getPlaceType={getPlaceType}
                  isNavigation={isNavigation}
                />
              )
              : <div style={{ width: "234px" }} /> }
            <FeatureFilter />
            <CapacityFilter />
          </Box>
        </Form>
      </Box>

      {!!state.location && state.location !== "Favorites"
        && (
          <BuildingPlaces
            buildingUpn={state.location}
            placeType={placeType}
            key={state.location + placeType}
            skipToken={skipTokenString}
          />
        )}
      {!!state.location && state.location === "Favorites"
        && (
          <Box styles={{ paddingTop: "1em" }}>
            <RepeatingBox>
              {state.getFilteredCustomPlaces(favoriteCampuses)
                .map((place) => (
                  <PlaceCard
                    key={`favoritesonly_${place.identity}`}
                    place={place}
                    buildingName={place.building}
                  />
                ))}
            </RepeatingBox>
          </Box>
        )}
      {!state.location && !buildingsLoading && buildings && buildings?.buildingsList.length > 0 && (
        <CustomizedPlaceCollectionAccordian
          closestBuilding={buildings?.buildingsList[0]}
          favoriteCampuses={adminSettings?.workspaceEnabled
            ? favoriteCampuses
            : favoriteCampuses.filter((i) => i.type !== PlaceType.Space)}
          getSkipToken={onSkipToken}
          selectedUsersDetails={
            userResult
              .filter((value) => value?.status === "success")
              .map((result) => result?.data ?? {})
          }
          placeType={placeType}
        />
      )}
      {buildingsLoading && <Loader />}

    </DisplayBox>
  );
};

export default Places;
