import React from "react";
import {
  Box, Button, Loader, Text,
} from "@fluentui/react-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import { User } from "@microsoft/microsoft-graph-types";
import dayjs, { Dayjs } from "dayjs";
import WorkgroupAvatar from "../../home/components/WorkgroupAvatar";
import { useGetUserAvalabilityTimes } from "../../../hooks/useGetTeammates";
import createDeepLink from "../../../utilities/deepLink";
import LocationType from "../../../types/LocationType";
import UserLocation from "../../../types/UserLocation";
import useGetAppSettings from "../../../hooks/useAppSettings";
import TimeLimit from "../../../types/TimeLimit";
import UserAvailableTimes from "../../../types/UserAvailableTimes";
import WeekdayButtonStyles from "../styles/WeekdayButtonStyles";
import uid from "../../../utilities/UniqueId";

interface AvailabilityPopupProps {
  user: User;
  location: UserLocation;
  inOffice: boolean;
}

const AvailabilityPopup: React.FC<AvailabilityPopupProps> = (props) => {
  const { user, location, inOffice } = props;
  const [avalaibleTime, setAvailableTimes] = React.useState<TimeLimit[]>([]);
  const date = dayjs(location.date);
  const day = dayjs(location.date);
  const scheduleDate = dayjs(date).startOf("day");
  const scheduleStart = scheduleDate.toDate();
  const scheduleEnd = dayjs(scheduleStart).add(1, "day").toDate();
  const users = [user.userPrincipalName as string];
  const { data: appSettings } = useGetAppSettings();
  const {
    data: availabilityTimes,
    isLoading: timesLoading,
  } = useGetUserAvalabilityTimes(users, dayjs(location.date), scheduleStart, scheduleEnd);
  const styles = WeekdayButtonStyles();

  const getTime = React.useCallback((time: string, dte?: Date): Dayjs => {
    const [hour, minute] = time.split(":");
    const dateToUse = dte || new Date();
    return dayjs(dateToUse).set("hour", Number(hour)).set("minute", Number(minute));
  }, []);
  const getTimeString = (time: string) => getTime(time).format("h:mm A");

  const utcTimeToLocalTime = (time: string, overnightFlag: boolean) => {
    const startCorrespondents = time.split(":").map((c) => parseInt(c, 10));
    const startUTC = dayjs(location.date).utc()
      .year(date.year())
      .month(date.month())
      .date(date.date())
      .hour(startCorrespondents[0])
      .minute(startCorrespondents[1])
      .second(startCorrespondents[2]);
    if (overnightFlag === true) {
      return dayjs(startUTC.add(1, "days")).local().format("HH:mm:ss");
    }
    return dayjs(startUTC).local().format("HH:mm:ss");
  };

  const handleButtonClick = (
    start: string,
    end: string,
  ) => {
    if (location.name === LocationType.Remote) {
      microsoftTeams.executeDeepLink(
        createDeepLink("collaborate", {
          start: getTime(start, day.toDate()).toISOString(),
          end: getTime(end, day.toDate()).toISOString(),
          users: users.join("!"),
        }, appSettings?.clientId ?? ""),
      );
    } else if (inOffice) {
      microsoftTeams.executeDeepLink(
        createDeepLink("places", {
          location: location.uri,
          date: day.toDate()?.valueOf().toString() ?? "",
          start: getTime(start, day.toDate()).toISOString(),
          end: getTime(end, day.toDate()).toISOString(),
          users: users.join("!"),
        }, appSettings?.clientId ?? ""),
      );
    }
  };

  React.useEffect(() => {
    const newAvailableTimes: TimeLimit[] = [];
    if (availabilityTimes) {
      availabilityTimes.multiUserAvailabilityTimes.forEach(
        (userAvailableTime: UserAvailableTimes) => {
          const timeSlots = userAvailableTime.availabilityTimes.map((time: TimeLimit) => ({
            start: utcTimeToLocalTime(time.start, time.isOvernight),
            end: utcTimeToLocalTime(time.end, time.isOvernight),
            isOvernight: time.isOvernight,
          }));
          newAvailableTimes.push(...timeSlots);
        },
      );
      setAvailableTimes(newAvailableTimes);
    }
  }, [availabilityTimes]);

  return (
    <Box style={{ display: "flex" }}>
      <WorkgroupAvatar user={user} />
      <Text
        className={styles.popupText}
        content={user?.displayName}
        weight="bold"
      />
      <Box
        className={styles.popupContainer}
      >
        {
          // eslint-disable-next-line no-nested-ternary
          avalaibleTime.length > 0 ? avalaibleTime.slice(0, 3).map((at) => (
            <Button
              className={styles.availableTimeButton}
              key={uid()}
              size="small"
              content={`${getTimeString(at.start)} - ${getTimeString(at.end)}`}
              onClick={() => {
                handleButtonClick(at.start, at.end);
              }}
            />
          ))
            : timesLoading ? <Loader size="small" /> : "No time slots available!"
        }
      </Box>
    </Box>
  );
};

export default AvailabilityPopup;
