// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { Shimmer } from "office-ui-fabric-react";
import { IShimmerStyles, ShimmerElementType } from "@fluentui/react/lib/Shimmer";
import { useGetUserPrediciton } from "../../../hooks/usePrediction";

interface Props {
  user: MicrosoftGraph.User
}

const UserLocation: React.FC<Props> = (props) => {
  const { user } = props;
  const today = new Date();
  const { data: location, isError } = useGetUserPrediciton(user?.userPrincipalName ?? "", today);
  const [loaded, setLocationLoaded] = React.useState(false);

  const shimmerWithElementFirstRow = [
    { type: ShimmerElementType.line },
  ];
  const shimmerStyles: IShimmerStyles = {
    root: {
      width: "300%",
      borderRadius: 8,
      display: "inline-flex",
    },
  };

  React.useEffect(() => {
    if (location) {
      setLocationLoaded(true);
    }
  }, [location]);

  return (
    <Shimmer
      styles={shimmerStyles}
      isDataLoaded={loaded}
      shimmerElements={shimmerWithElementFirstRow}
    >
      <span style={{ fontSize: "small" }}>{isError ? "Unknown" : location}</span>
    </Shimmer>
  );
};

export default UserLocation;
