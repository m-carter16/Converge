import React from "react";
import {
  Box, Flex, Text,
} from "@fluentui/react-northstar";
import { useGetMyOpportunities } from "../../../hooks/useMyOpportunities";
import SelectableTable from "../../home/Table/SelectableTable";

interface IMyOpportunitiesProps {
  prediction: string;
}

const MyOpportunities: React.FC<IMyOpportunitiesProps> = (props) => {
  const { prediction } = props;
  const date = new Date();
  const { data: opportunities, refetch } = useGetMyOpportunities(date);

  React.useEffect(() => {
    refetch();
  }, [prediction]);

  return (
    <>
      {
        prediction && prediction !== "Out of Office"
          ? (
            <Flex>
              <Box style={{ display: "flex", width: "90%", flexDirection: "column" }}>
                <h4>
                  Opportunities to connect today in the&nbsp;
                  {prediction}
                  &nbsp;office.
                </h4>
                {
                  opportunities && opportunities?.length > 0
                    ? (
                      <Box styles={{ width: "100%" }}>
                        <SelectableTable
                          teammates={opportunities}
                          usedAsOpprtunityTable
                        />
                      </Box>
                    ) : (
                      <Text
                        content="No opportunities found for today"
                        style={{ color: "#5B5FC7" }}
                        weight="semibold"
                        temporary
                      />
                    )
                }
              </Box>
            </Flex>
          )
          : null
      }
    </>
  );
};

export default MyOpportunities;
