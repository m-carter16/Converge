// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";
import { Text } from "@fluentui/react-northstar";
import { Shimmer, ShimmerElementType } from "@fluentui/react";
import { useGetUserWorkingHours } from "../../../hooks/useUserDetails";

interface Props {
  userId: string;
}
const shimmerElements = [
  { type: ShimmerElementType.line, width: "120px", height: 20 },
];

const WorkingHoursCell: React.FC<Props> = ({ userId }) => {
  const { data: userWorkingHours, isLoading, isError } = useGetUserWorkingHours(userId);

  function convertTo12HourClock(timeString: string): string {
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = (hours % 12) || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }
  if (isLoading) {
    return <Shimmer shimmerElements={shimmerElements} />;
  }

  if (isError || !userWorkingHours) {
    return <Text content="Unknown" />;
  }

  return (
    <Text>
      {`${convertTo12HourClock(userWorkingHours?.startTime)} - ${convertTo12HourClock(userWorkingHours?.endTime)}`}
      {" "}
    </Text>
  );
};

export default WorkingHoursCell;
