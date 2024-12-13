// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from "react";
import {
  Image, Box, Button, Dialog, Flex, Provider, SiteVariablesPrepared, Text,
} from "@fluentui/react-northstar";
import { CloseIcon } from "@fluentui/react-icons-northstar";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { Icon } from "office-ui-fabric-react";
import dayjs, { Dayjs } from "dayjs";
import BookPlaceModal from "./BookPlaceModal";
import ExchangePlace, { PlaceType } from "../../../types/ExchangePlace";
import { useProvider as PlaceProvider, useProvider as PlaceFilterProvider } from "../../../providers/PlaceFilterProvider";
import { logEvent } from "../../../utilities/LogWrapper";
import {
  UI_SECTION, UISections, USER_INTERACTION, DESCRIPTION,
} from "../../../types/LoggerTypes";
import NewConfRoomEvent from "./NewConfRoomEvent";
import Notifications from "../../../utilities/ToastManager";
import ImagePlaceholder from "../../../utilities/ImagePlaceholder";
import PlaceCardStyles from "../styles/PlaceCardStyles";
import { useApiProvider } from "../../../providers/ApiProvider";
import { useConvergeSettingsContextProvider } from "../../../providers/ConvergeSettingsProvider";
import AddRecentBuildings from "../../../utilities/RecentBuildingsManager";
import usePlacePhotos from "../../../hooks/usePlacePhotos";
import { ConvergeSettings } from "../../../types/ConvergeSettings";

type Props = {
  place: ExchangePlace,
  buildingName: string,
  selectedUsersDetails?: MicrosoftGraph.User[],
};

const PlaceCard: React.FC<Props> = (props) => {
  const { place, buildingName, selectedUsersDetails } = props;
  const {
    calendarService,
    meService,
    placeService,
  } = useApiProvider();
  const classes = PlaceCardStyles();
  const {
    convergeSettings,
    setConvergeSettings,
  } = useConvergeSettingsContextProvider();
  const { createReservation } = PlaceFilterProvider();
  const [open, setOpen] = useState<boolean>(false);
  const [newEventDialogOpen, setNewEventDialogOpen] = useState<boolean>(false);
  const [bookable, setBookable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | undefined>(undefined);
  const { state, loadUpcomingReservations } = PlaceProvider();
  const [start, setStart] = useState<Dayjs>(state.startDate);
  const [end, setEnd] = useState<Dayjs>(state.endDate);
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [isFlexibleSeating, setIsFlexibleSeating] = useState<boolean | undefined>(false);
  const [availability, setAvailability] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const { data: placePhotos } = usePlacePhotos(place.sharePointID);
  const photoUrl = placePhotos?.coverPhoto?.url;
  const [newSettings, setNewSettings] = useState<ConvergeSettings>({});

  useEffect(() => {
    setEnd(state.endDate);
  }, [state.endDate]);

  useEffect(() => {
    setStart(state.startDate);
  }, [state.startDate]);

  const clearPlaceCard = () => {
    setStart(state.startDate);
    setEnd(state.endDate);
    setIsAllDay(false);
    return state.startDate;
  };

  const getAvailability = () => {
    setAvailabilityLoading(true);
    if (state.startDate.utc().toISOString() <= state.endDate.utc().toISOString()) {
      if (place.type === PlaceType.Space) {
        placeService.getPlaceMaxReserved(
          place.identity,
          (state.startDate).utc().toISOString(),
          (state.endDate).utc().toISOString(),
        ).then((maxReserved) => {
          setAvailability((place.capacity - maxReserved) < 1 ? 0 : place.capacity - maxReserved);
        })
          .finally(() => setAvailabilityLoading(false));
      } else {
        placeService.getRoomAvailability(
          place.identity,
          (state.startDate).utc().toISOString(),
          (state.endDate).utc().toISOString(),
        ).then((roomIsAvailable) => {
          setIsAvailable(roomIsAvailable);
        }).finally(() => setAvailabilityLoading(false));
      }
    }
  };

  useEffect(() => {
    getAvailability();
  }, [place, state.startDate, state.endDate]);

  useEffect(() => {
    setIsFlexibleSeating(place?.displayName?.toLowerCase().startsWith("flex space"));
  }, [place]);

  const isWorkspace = place.type === PlaceType.Space;

  const getNewSettings = (newConvergeSettings: ConvergeSettings) => {
    setNewSettings(newConvergeSettings);
  };

  return (
    <>
      {(!isWorkspace && isAvailable) || isWorkspace ? (
        <>
          <Box
            className={classes.lightCard}
            key={place.identity}
          >
            <Box>
              {
                !photoUrl
                  ? <ImagePlaceholder width="100%" height="123px" borderRadius="5px 5px 0 0" fluid />
                  : (
                    <Box className={classes.imgWrapper}>
                      <Image
                        className={classes.imageContainer}
                        fluid
                        src={photoUrl}
                      />
                    </Box>
                  )
              }
            </Box>
            <Flex space="between" gap="gap.small" padding="padding.medium" vAlign="start" hAlign="center">
              <Flex
                column
                className={classes.detailsWrapper}
              >
                <Box
                  className={classes.displayName}
                  title={place.displayName}
                >
                  {place.displayName}
                </Box>
                <Flex className={classes.lightTheme} styles={{ fontSize: "12px" }} gap="gap.smaller">
                  <span className={classes.buildingName} title={buildingName}>
                    {buildingName}
                  </span>
                  {place.floor
                    && (
                      <>
                        <span>|</span>
                        <span>
                          Floor
                          {" "}
                          {place.floor}
                        </span>
                      </>
                    )}
                  {!isWorkspace
                    && (
                      <>
                        <span>|</span>
                        <Icon iconName="contact" />
                        <span>{place.capacity}</span>
                      </>
                    )}
                </Flex>
              </Flex>
              <Box>
                <Provider
                  theme={{
                    componentVariables: {
                      Dialog: ({ colorScheme }: SiteVariablesPrepared) => ({
                        rootWidth: "795px",
                        headerFontSize: "18px",
                        rootBackground: colorScheme.default.background,
                        color: colorScheme.default.background3,
                      }),
                    },
                  }}
                >
                  <>
                    <Dialog
                      open={open}
                      onOpen={() => {
                        logEvent(USER_INTERACTION, [
                          { name: UI_SECTION, value: UISections.BookPlaceModal },
                          { name: DESCRIPTION, value: "open_modal" },
                        ]);
                        setOpen(true);
                      }}
                      onCancel={() => {
                        logEvent(USER_INTERACTION, [
                          { name: UI_SECTION, value: UISections.BookPlaceModal },
                          { name: DESCRIPTION, value: "cancel_modal" },
                        ]);
                        clearPlaceCard();
                        setOpen(false);
                        Object.keys(newSettings).length && setConvergeSettings(newSettings);
                      }}
                      onConfirm={() => {
                        logEvent(USER_INTERACTION, [
                          { name: UI_SECTION, value: UISections.BookPlaceModal },
                          { name: DESCRIPTION, value: "confirm_modal" },
                        ]);
                        if (place.type === PlaceType.Room) {
                          setOpen(false);
                          setNewEventDialogOpen(true);
                        }
                        if (place.type === PlaceType.Space) {
                          setLoading(true);
                          let startDate = start.utc().toDate();
                          let endDate = end.utc().toDate();
                          if (isAllDay) {
                            startDate = dayjs(start.format("YYYY-MM-DD")).toDate();
                            endDate = dayjs(end.add(1, "day").format("YYYY-MM-DD")).toDate();
                          }
                          calendarService.createEvent({
                            isAllDay,
                            start: startDate,
                            end: endDate,
                            attendees: [{
                              emailAddress: place.identity,
                              type: "resource" as MicrosoftGraph.AttendeeType,
                            }],
                            location: {
                              displayName: place.displayName,
                              locationEmailAddress: place.identity,
                              locationType: "conferenceRoom",
                            },
                            // Do not change title. It is used in workspace event creation
                            title: "Converge Workspace Booking",
                            showAs: "free" as MicrosoftGraph.FreeBusyStatus,
                          })
                            .then((calendarEvent) => {
                              const newConvergeSettings = {
                                ...convergeSettings,
                                recentBuildingUpns: AddRecentBuildings(
                                  convergeSettings?.recentBuildingUpns,
                                  place.locality,
                                ),
                              };
                              setConvergeSettings(newConvergeSettings);
                              createReservation(calendarEvent);
                              return meService.updateMyLocation({
                                year: dayjs(startDate).year(),
                                month: dayjs(startDate).month() + 1,
                                day: dayjs(startDate).date(),
                                userPredictedLocation: {
                                  campusUpn: place.locality,
                                },
                              });
                            })
                            .then(() => {
                              clearPlaceCard();
                              setOpen(false);
                              getAvailability();
                              loadUpcomingReservations(
                                state.upcomingReservationsStartDate,
                                state.upcomingReservationsEndDate,
                              );
                              Notifications.show({
                                duration: 5000,
                                title: "You reserved a workspace.",
                                content: `${place?.displayName} (${dayjs(startDate).format("ddd @ h:mm A")})`,
                              });
                            })
                            .catch(() => {
                              setErr("Something went wrong with your workspace reservation. Please try again.");
                            })
                            .finally(() => {
                              setLoading(false);
                            });
                        }
                      }}
                      confirmButton={{
                        content: isWorkspace ? "Reserve" : "Create event",
                        disabled: !bookable,
                        loading,
                      }}
                      cancelButton="Cancel"
                      content={(
                        <BookPlaceModal
                          place={place}
                          bookable={bookable}
                          setBookable={setBookable}
                          buildingName={buildingName}
                          err={err}
                          start={start}
                          end={end}
                          setStart={setStart}
                          setEnd={setEnd}
                          isAllDay={isAllDay}
                          setIsAllDay={setIsAllDay}
                          isFlexible={isFlexibleSeating}
                          getNewSettings={getNewSettings}
                        />
                      )}
                      header={(
                        <Text
                          as="h2"
                          content={`Book a ${isWorkspace ? "workspace" : "meeting room"}`}
                          styles={{ fontSize: "18px", color: "#252525", fontWeight: "normal" }}
                          className={classes.lightTheme}
                        />
                      )}
                      headerAction={{
                        icon: <CloseIcon />,
                        title: "Close",
                        onClick: () => {
                          clearPlaceCard();
                          logEvent(USER_INTERACTION, [
                            { name: UI_SECTION, value: UISections.BookPlaceModal },
                            { name: DESCRIPTION, value: "close_modal" },
                          ]);
                          setOpen(false);
                          Object.keys(newSettings).length && setConvergeSettings(newSettings);
                        },
                      }}
                      trigger={(
                        <Button
                          className={classes.triggerBtn}
                          loading={availabilityLoading}
                          content={(
                            <>
                              {!availabilityLoading && isWorkspace && `${availability} available`}
                              {(!availabilityLoading && !isWorkspace) && `${!isAvailable ? "Unavailable" : "Available"}`}
                            </>
                          )}
                        />
                      )}
                      className={classes.dialog}
                    />
                    <NewConfRoomEvent
                      open={newEventDialogOpen}
                      setOpen={setNewEventDialogOpen}
                      place={place}
                      start={start}
                      end={end}
                      setStart={setStart}
                      setEnd={setEnd}
                      clearPlaceCard={clearPlaceCard}
                      getAvailability={getAvailability}
                      selectedUsersDetails={selectedUsersDetails}
                    />
                  </>
                </Provider>
              </Box>
            </Flex>
          </Box>
        </>
      ) : null}
    </>
  );
};

export default PlaceCard;
