import { Button, Popup, Tooltip } from "@fluentui/react-northstar";
import { User } from "@microsoft/microsoft-graph-types";
import dayjs from "dayjs";
import React from "react";
import LocationType from "../../../types/LocationType";
import UserLocation from "../../../types/UserLocation";
import AvailabilityPopup from "./AvailabilityPopup";

interface WeekdayButtonProps {
  user: User,
  location: UserLocation
}

const WeekdayButton: React.FC<WeekdayButtonProps> = (props) => {
  const { user, location } = props;
  const date = dayjs(location.date);
  const day = date.format("dd");
  const dayLetter = day.substring(0, day.length - 1);
  const startOfDate = date.startOf("day");
  const isPast = startOfDate.isBefore(dayjs().startOf("day"));
  const disabled = isPast
    || location.name === LocationType.ScheduledOff;
  const inOffice = location.name !== LocationType.Remote
    && location.name !== LocationType.ScheduledOff;

  const buttonColor = () => {
    if (disabled) {
      return "default";
    }
    if (inOffice) {
      return "#00b7eb";
    }
    return "black";
  };

  const borderStyle = () => {
    if (disabled) {
      return "default";
    }
    if (inOffice) {
      return "1px solid #00b7eb";
    }
    return "cccccc";
  };

  return (
    <Popup
      trigger={(
        <Tooltip
          trigger={(
            <Button
              disabled={disabled}
              style={{
                margin: 2,
                color: buttonColor(),
                border: borderStyle(),
              }}
              circular
              content={dayLetter}
            />
        )}
          content={location.name}
        />
      )}
      content={<AvailabilityPopup user={user} location={location} inOffice={inOffice} />}
      position="above"
      pointing
    />
  );
};

export default WeekdayButton;
