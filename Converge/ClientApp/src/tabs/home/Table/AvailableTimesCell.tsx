// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  Button, Flex, Label,
} from "@fluentui/react-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import dayjs, { Dayjs } from "dayjs";
import React from "react";
import { Shimmer } from "@fluentui/react";
import { ShimmerElementType } from "office-ui-fabric-react";
import { useAppSettingsProvider } from "../../../providers/AppSettingsProvider";
import {
  DESCRIPTION, UISections, UI_SECTION, USER_INTERACTION,
} from "../../../types/LoggerTypes";
import TimeLimit from "../../../types/TimeLimit";
import createDeepLink from "../../../utilities/deepLink";
import { logEvent } from "../../../utilities/LogWrapper";
import uid from "../../../utilities/UniqueId";

interface Props {
  loading: boolean;
  availableTimes: TimeLimit[];
  disabled: boolean;
  date: Date;
  selectedUserUpns: string[];
  userUpn: string;
  usedAsOpprtunityTable?: boolean;
}

const shimmerElements = [
  { type: ShimmerElementType.line, width: "120px", height: 20 },
  { type: ShimmerElementType.gap, width: "5px" },
  { type: ShimmerElementType.line, width: "120px", height: 20 },
  { type: ShimmerElementType.gap, width: "5px" },
  { type: ShimmerElementType.line, width: "120px", height: 20 },
];

const getTime = (time: string, date?: Date): Dayjs => {
  const [hour, minute] = time.split(":");
  const dateToUse = date || Date();
  return dayjs(dateToUse).set("hour", Number(hour)).set("minute", Number(minute));
};

const getTimeString = (time: string) => getTime(time).format("h:mm A");

const AvailableTimesCell: React.FC<Props> = (props) => {
  const {
    loading, availableTimes, disabled, date, selectedUserUpns, userUpn, usedAsOpprtunityTable,
  } = props;
  const { appSettings } = useAppSettingsProvider();

  const handleButtonClick = (start: string, end: string) => {
    let users:string[] = [];
    if (selectedUserUpns.length) {
      users = selectedUserUpns;
    } else {
      users = [userUpn];
    }
    if (usedAsOpprtunityTable) {
      const day = dayjs(date);
      microsoftTeams.executeDeepLink(
        createDeepLink("places", {
          location: "",
          date: dayjs(day).toDate()?.valueOf().toString() ?? "",
          start: getTime(start, dayjs(day).toDate()).toISOString(),
          end: getTime(end, dayjs(day).toDate()).toISOString(),
          users: users.join("!"),
        }, appSettings?.clientId ?? ""),
      );
    } else {
      microsoftTeams.executeDeepLink(
        createDeepLink("collaborate", {
          start: getTime(start, date).toISOString(),
          end: getTime(end, date).toISOString(),
          users: users.join("!"),
        }, appSettings?.clientId ?? ""),
      );
    }
  };

  if (loading) {
    return <Shimmer shimmerElements={shimmerElements} />;
  }

  return (availableTimes?.length ? (
    <Flex gap="gap.small" vAlign="center">
      {availableTimes.slice(0, 3).map((at) => (
        <Button
          key={uid()}
          disabled={disabled}
          size="small"
          content={`${getTimeString(at.start)} - ${getTimeString(at.end)}`}
          onClick={() => {
            handleButtonClick(at.start, at.end);
            logEvent(USER_INTERACTION, [
              { name: UI_SECTION, value: UISections.ConnectWithTeammates },
              { name: DESCRIPTION, value: "available_times_click" },
            ]);
          }}
        />
      ))}
    </Flex>
  ) : (
    <Label content="No available times" color="white" />)
  );
};

export default AvailableTimesCell;
