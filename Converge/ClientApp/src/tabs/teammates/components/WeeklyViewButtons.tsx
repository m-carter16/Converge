import React from "react";
import { Box } from "@fluentui/react-northstar";
import { User } from "@microsoft/microsoft-graph-types";
import { Shimmer, ShimmerElementType } from "@fluentui/react";
import WeekdayButton from "./WeekdayButton";
import WeeklyViewStyles from "../../teammates/styles/WeeklyViewStyles";
import uid from "../../../utilities/UniqueId";
import UserLocation from "../../../types/UserLocation";

interface WeeklyViewButtonsProps {
  user: User;
  locations: UserLocation[];
  isLoading: boolean;
}

const WeeklyViewButtons: React.FC<WeeklyViewButtonsProps> = (props) => {
  const { user, locations, isLoading } = props;
  const style = WeeklyViewStyles();

  const shimmerElements = [
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.gap, width: "4px" },
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.gap, width: "4px" },
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.gap, width: "4px" },
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.gap, width: "4px" },
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.gap, width: "4px" },
  ];

  return (
    <>
      <Box className={style.Container}>
        {isLoading ? (
          <Shimmer shimmerElements={shimmerElements} />
        )
          : locations.map((location) => (
            <WeekdayButton
              key={uid()}
              user={user}
              location={location}
            />
          ))}
      </Box>
    </>
  );
};

export default WeeklyViewButtons;
