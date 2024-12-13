// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import {
  Flex, Divider, Text, Provider, Button, Loader, Box,
} from "@fluentui/react-northstar";
import { useLocation } from "react-router";
import BookWorkspaceStyles from "../tabs/home/styles/BookWorkspaceStyles";
import { logEvent } from "./LogWrapper";
import {
  DESCRIPTION, UISections, UI_SECTION, USER_INTERACTION,
} from "../types/LoggerTypes";
import {
  useGetBuildingsByDistance, useGetBuildingsByName,
  useGetRecentBuildings,
} from "../hooks/useBuildings";
import { useGetConvergeSettings } from "../hooks/useConvergeSettings";
import uid from "./UniqueId";
import BuildingBasicInfo from "../types/BuildingBasicInfo";

interface Props {
  headerTitle: string,
  selected: BuildingBasicInfo | undefined;
  handleDropdownChange: (bldg: BuildingBasicInfo | undefined) => void;
  buttonTitle: string;
  maxHeight: string;
}

const BuildingPickerContent: React.FunctionComponent<Props> = (props) => {
  const {
    headerTitle, selected, buttonTitle, maxHeight,
  } = props;
  const [distance, setDistance] = React.useState(25);
  const { data: userSettings } = useGetConvergeSettings();
  const { data: recentBuildings, isLoading: recentBuildingsLoading } = useGetRecentBuildings();

  const {
    data: buildings,
    isLoading: buildingsLoading,
    refetch,
  } = userSettings?.geoCoordinates

    ? useGetBuildingsByDistance(`${userSettings?.geoCoordinates.latitude},${userSettings?.geoCoordinates.longitude}`, distance)
    : useGetBuildingsByName();
  const classes = BookWorkspaceStyles();
  const location = useLocation();

  const onClickSeeMore = () => {
    if (distance < 1000) {
      setDistance(distance * 100);
      refetch();
    } else if (distance < 4000) {
      setDistance(distance + 1501);
      refetch();
    }
  };

  React.useEffect(() => {
    if (buildings?.buildingsList && buildings?.buildingsList.length > 0) {
      buildings?.buildingsList.sort((a, b) => {
        if (a.displayName < b.displayName) {
          return -1;
        }
        if (a.displayName > b.displayName) {
          return 1;
        }
        return 0;
      });
    }
  }, [buildings]);

  return (
    <Provider>
      {(recentBuildings && recentBuildings.length > 0)
        && (
          <>
            <Box>
              <Flex vAlign="center">
                <Text content={headerTitle} weight="semibold" styles={{ marginLeft: "1rem" }} />
              </Flex>
            </Box>
            {location.pathname !== "/workspace" && selected?.displayName !== ""
              && (
                <Box>
                  <>
                    <Button
                      text
                      styles={{ minWidth: "0rem !important", maxWidth: "230px !important" }}
                      onClick={() => {
                        props.handleDropdownChange(selected);
                        logEvent(USER_INTERACTION, [
                          {
                            name: UI_SECTION,
                            value: UISections.PopupMenuContent,
                          },
                          {
                            name: DESCRIPTION,
                            value: "handleDropdownChange",
                          },
                        ]);
                      }}
                    >
                      <Text
                        content={selected?.displayName}
                        title={selected?.displayName}
                        weight="semilight"
                        styles={{
                          whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", marginLeft: "0.6rem", marginTop: "1rem",
                        }}
                      />
                    </Button>
                  </>
                </Box>
              )}
            {location.pathname === "/workspace" && recentBuildingsLoading && <Loader size="smallest" />}
            {location.pathname === "/workspace"
              && (
                <Box>
                  {recentBuildings.map((item) => (
                    <Flex key={uid()}>
                      <Button
                        text
                        styles={{ minWidth: "0rem !important", maxWidth: "230px !important" }}
                        onClick={() => {
                          props.handleDropdownChange(item);
                          logEvent(USER_INTERACTION, [
                            {
                              name: UI_SECTION,
                              value: UISections.PopupMenuContent,
                            },
                            {
                              name: DESCRIPTION,
                              value: "handleDropdownChange",
                            },
                          ]);
                        }}
                      >
                        <Text
                          content={item.displayName}
                          title={item.displayName}
                          weight="semilight"
                          styles={{
                            whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", marginLeft: "0.6rem", marginTop: "1rem",
                          }}
                        />
                      </Button>
                    </Flex>
                  ))}
                </Box>
              )}
            <Divider className="filter-popup-menu-divider" styles={{ marginTop: "0.4rem" }} />
          </>
        )}
      <Box className={classes.WorkSpacebuildingContent} styles={{ maxHeight }}>
        <Box>
          <Flex gap="gap.small" vAlign="center">
            <Text content="Buildings near you" weight="semibold" styles={{ marginLeft: "1rem", marginTop: "0.6rem" }} />
          </Flex>
        </Box>
        {buildings?.buildingsList && buildings.buildingsList.length > 0
          && (
            <Box>
              {buildings.buildingsList.map((item) => (
                <Flex key={uid()}>
                  <Button
                    text
                    styles={{ minWidth: "0rem !important", maxWidth: "230px !important" }}
                    onClick={() => {
                      props.handleDropdownChange(item);
                      logEvent(USER_INTERACTION, [
                        {
                          name: UI_SECTION,
                          value: UISections.PopupMenuContent,
                        },
                        {
                          name: DESCRIPTION,
                          value: "handleDropdownChange",
                        },
                      ]);
                    }}
                  >
                    <Text
                      content={item.displayName}
                      title={item.displayName}
                      weight="semilight"
                      styles={{
                        whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", marginLeft: "0.6rem", marginTop: "1rem",
                      }}
                    />
                  </Button>
                </Flex>
              ))}
            </Box>
          )}
      </Box>
      {buildingsLoading && <Loader size="smallest" />}
      <Divider className="filter-popup-menu-divider" styles={{ marginTop: "0.4rem" }} />
      {distance < 4000
      && (
        <Flex gap="gap.small" vAlign="center" hAlign="start" styles={{ marginBottom: "1.5%" }}>
          <Button
            text
            content={buttonTitle}
            onClick={() => {
              onClickSeeMore();
              logEvent(USER_INTERACTION, [
                {
                  name: UI_SECTION,
                  value: UISections.PopupMenuContent,
                },
                {
                  name: DESCRIPTION,
                  value: "onClickSeeMore",
                },
              ]);
            }}
            styles={{ color: "#464775" }}
          />
        </Flex>
      )}
    </Provider>
  );
};

export default BuildingPickerContent;
