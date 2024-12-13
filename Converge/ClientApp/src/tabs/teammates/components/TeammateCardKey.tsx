import React from "react";
import { Button, Flex, Text } from "@fluentui/react-northstar";

const OpportunityCardKey: React.FC = () => (
  <Flex hAlign="end" styles={{ height: "18px" }}>
    <Text size="small">
      <Button
        style={{
          margin: 2,
          minWidth: "18px",
          height: "18px",
          fontSize: "7px",
          color: "#00b7eb",
          border: "1px solid #00b7eb ",
        }}
        circular
      >
        M
      </Button>
      &nbsp;In-office&nbsp;&nbsp;
    </Text>
    <Text size="small">
      <Button
        style={{
          margin: 2,
          minWidth: "18px",
          height: "18px",
          fontSize: "7px",
          color: "#242424",
          border: "default",
        }}
        circular
      >
        M
      </Button>
      &nbsp;Remote
    </Text>
  </Flex>
);

export default OpportunityCardKey;
