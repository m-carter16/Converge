// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { Shimmer, Icon, mergeStyles } from "office-ui-fabric-react";
import { IShimmerStyles, ShimmerElementType } from "@fluentui/react/lib/Shimmer";
import {
  Box, BuildingIcon, Flex, LeaveIcon, Loader, QuestionCircleIcon, Text,
} from "@fluentui/react-northstar";
import { useGetUserPrediciton } from "../../../hooks/usePrediction";
import OpportunityCardStyles from "../styles/TeammateCardStyles";
import LocationType from "../../../types/LocationType";

interface Props {
  user: MicrosoftGraph.User
}

const TeammateCardLocation: React.FC<Props> = (props) => {
  const { user } = props;
  const today = new Date();
  const { data: location, isLoading } = useGetUserPrediciton(user?.userPrincipalName ?? "", today);
  const [icon, setIcon] = React.useState(<Loader
    size="smallest"
    labelPosition="start"
    style={{ alignItems: "center" }}
  />);
  const styles = OpportunityCardStyles();
  const iconClass = mergeStyles({
    position: "relative",
    top: "-3px",
    fontSize: "16px",
    paddingLeft: "5px",
  });

  const shimmerWithElementFirstRow = [
    { type: ShimmerElementType.line },
  ];
  const shimmerStyles: IShimmerStyles = {
    root: {
      width: "60%",
      borderRadius: 8,
      display: "inline-flex",
    },
  };

  React.useEffect(() => {
    if (location) {
      switch (location.name) {
        case LocationType.Remote:
          setIcon(<Icon iconName="Home" className={iconClass} />);
          break;
        case "Out of Office":
          setIcon(<LeaveIcon outline />);
          break;
        case "Unknown":
          setIcon(<QuestionCircleIcon outline />);
          break;
        default:
          setIcon(<BuildingIcon outline />);
          break;
      }
    }
  }, [location]);

  return (
    <Shimmer
      styles={shimmerStyles}
      isDataLoaded={!isLoading}
      shimmerElements={shimmerWithElementFirstRow}
    >
      <Box className={styles.location} style={{ width: 150 }}>
        <Flex hAlign="start">
          <div className={styles.icon}>
            {icon}
          </div>
          <Text size="small">
            <Box style={{ fontSize: "small" }}>{location?.name}</Box>
          </Text>
        </Flex>
      </Box>
    </Shimmer>
  );
};

export default TeammateCardLocation;
