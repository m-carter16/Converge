import * as React from "react";

import {
  Box,
  ContactGroupIcon,
  Flex,
  FlexItem,
  Text,
} from "@fluentui/react-northstar";
import { VictoryPie } from "victory";
import InOfficeGraphStyles from "../styles/InOfficeGraphStyles";

export interface IInOfficeGraphProps {
  officeTeammates: number;
  teammates: number
}

const InOfficeGraph: React.FC<IInOfficeGraphProps> = (props) => {
  const { officeTeammates, teammates } = props;
  const classes = InOfficeGraphStyles();
  const percentage = teammates > 0
    ? Math.round((officeTeammates / teammates) * 100) : 0;
  const data: { x: number; y: number; color: string; l: string }[] = [
    {
      x: 1,
      y: percentage,
      color: "#237B4B",
      l: "Occupied",
    },
    {
      x: 2,
      y: 100 - percentage,
      color: "#D9DBDB",
      l: "Reserved",
    },
  ];

  return (
    <>
      <Box className={classes.graphContainer}>
        <VictoryPie
          colorScale={[
            "#237B4B",
            "#D9DBDB",
          ]}
          startAngle={0}
          endAngle={360}
          data={data}
          innerRadius={100}
          labels={() => ""}
          style={{
            data: { stroke: "white", strokeWidth: 10 },
          }}
        />
        <Flex
          vAlign="start"
          gap="gap.medium"
          className={classes.detailContainer}
        >
          <FlexItem>
            <ContactGroupIcon
              size="medium"
              className={classes.groupIcon}
            />
          </FlexItem>
          <FlexItem>
            <Text
              size="medium"
              weight="semilight"
              styles={{ paddingLeft: "2px" }}
            >
              {percentage}
              % team in-office
            </Text>
          </FlexItem>
        </Flex>
      </Box>
    </>
  );
};

export default InOfficeGraph;
