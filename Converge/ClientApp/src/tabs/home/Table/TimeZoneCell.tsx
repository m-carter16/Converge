// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import { Shimmer, ShimmerElementType } from "@fluentui/react";
import { Text } from "@fluentui/react-northstar";
import { useGetUserWorkingHours } from "../../../hooks/useUserDetails";

interface Props {
  userId: string;
}

const shimmerElements = [
  { type: ShimmerElementType.line, width: "120px", height: 20 },
];

const TimeZoneCell: React.FC<Props> = ({ userId }) => {
  const { data: userWorkingHours, isLoading, isError } = useGetUserWorkingHours(userId);

  if (isLoading) {
    return <Shimmer shimmerElements={shimmerElements} />;
  }

  if (isError || !userWorkingHours) {
    return <Text content="Unknown" />;
  }

  return (<span>{userWorkingHours?.timeZone?.name}</span>);
};

export default TimeZoneCell;
