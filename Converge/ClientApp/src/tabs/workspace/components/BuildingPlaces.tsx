// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import {
  Box,
  Button,
  Dropdown,
  DropdownProps,
  ErrorIcon,
  Flex,
  FormLabel,
  Loader,
  Text,
  useFluentContext,
} from "@fluentui/react-northstar";
import ExchangePlace, { PlaceType } from "../../../types/ExchangePlace";
import {
  DESCRIPTION, UISections, UI_SECTION, USER_INTERACTION,
} from "../../../types/LoggerTypes";
import { logEvent } from "../../../utilities/LogWrapper";
import BuildingPlacesStyles from "../styles/BuildingPlacesStyles";
import PlaceCard from "./PlaceCard";
import RepeatingBox from "./RepeatingBox";
import { useProvider as PlaceFilterProvider } from "../../../providers/PlaceFilterProvider";
import IsThisHelpful from "../../../utilities/IsThisHelpful";
import useGetBuildingPlaces from "../../../hooks/usePlaces";

interface IPlaceResultSetProps {
  buildingUpn: string;
  skipToken: string;
  placeType?: PlaceType;
}

const BuildingPlaces: React.FC<IPlaceResultSetProps> = ({
  buildingUpn, placeType,
  skipToken,
}) => {
  const { theme } = useFluentContext();
  const { state } = PlaceFilterProvider();
  const classes = BuildingPlacesStyles();
  const [count, setCount] = React.useState<number>(0);
  const [sortOrder, setSortOrder] = React.useState("Capacity");
  const [hasMore, setHasMore] = React.useState(true);
  const [skipTokenString, setSkipTokenString] = React.useState<string>(skipToken ?? "");
  const pageSizeOptions = [10, 15, 25, 50];
  const [itemsPerPage, setItemsPerPage] = React.useState<number>(pageSizeOptions[0]);
  const {
    data: places,
    isFetching: placesLoading,
  } = useGetBuildingPlaces(
    buildingUpn,
    placeType ?? PlaceType.Room,
    {
      topCount: itemsPerPage,
      hasAudio: state.attributeFilter.indexOf("audioDeviceName") > -1,
      hasDisplay: state.attributeFilter.indexOf("displayDeviceName") > -1,
      hasVideo: state.attributeFilter.indexOf("videoDeviceName") > -1,
      isAccessbile: state.attributeFilter.indexOf("isWheelChairAccessible") > -1,
      capacity: state.capacityFilter,
    },
  );

  const handleItemCountChange = (
    event: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element> | null,
    data: DropdownProps,
  ) => {
    setItemsPerPage(data?.value as number ?? pageSizeOptions[0]);
  };

  function sortByFloor(place1: ExchangePlace, place2: ExchangePlace) {
    if (place1.floor === null) {
      return 1;
    } if (place2.floor === null) {
      return -1;
    }

    return place1.floor.localeCompare(place2.floor);
  }

  const sortedPlaces = React.useMemo(() => {
    const placesList = places?.exchangePlacesList ?? [];
    if (sortOrder === "Capacity") {
      return [...placesList].sort((a, b) => b.capacity - a.capacity);
    }
    if (sortOrder === "Name") {
      return [...placesList].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    if (sortOrder === "Floor") {
      return [...placesList].sort(sortByFloor);
    }

    return placesList;
  }, [places, sortOrder]);

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
  };

  const increasePageSize = () => {
    const currentIdx = pageSizeOptions.findIndex((v) => v === itemsPerPage);
    const newIndex = pageSizeOptions[currentIdx + 1];
    setItemsPerPage(newIndex);
  };

  React.useEffect(() => {
    setHasMore(!!places?.skipToken);
    setCount(places?.exchangePlacesList ? places.exchangePlacesList.length : 0);
    setSkipTokenString(places?.skipToken ? places.skipToken : "");
  }, [places]);

  return (
    <Flex
      column
    >
      <Flex space="between">
        <Flex>
          <FormLabel
            htmlFor={`BuildingItemsPerRequest-${buildingUpn}`}
            className={classes.pageSizeLabel}
          >
            Show
          </FormLabel>
          <Dropdown
            id={`BuildingItemsPerRequest-${buildingUpn}`}
            title="Show"
            className={classes.pageSizeInput}
            items={pageSizeOptions}
            value={itemsPerPage}
            onSearchQueryChange={handleItemCountChange}
            position="below"
            variables={{
              width: "64px",
            }}
          />
        </Flex>
        <Flex>
          <FormLabel
            htmlFor={`BuildingSortby-${buildingUpn}`}
            className={classes.pageSizeLabel}
          >
            Sort by
          </FormLabel>
          <Dropdown
            id={`BuildingSortby-${buildingUpn}`}
            title="Show"
            items={["Capacity", "Name", "Floor"]}
            position="below"
            value={sortOrder}
            onChange={(_, { value }) => handleSortOrderChange(value as string)}
          />
        </Flex>
      </Flex>
      <Flex hAlign="center" vAlign="center" style={{ marginTop: "8px" }}>
        {!placesLoading && hasMore === false && count === 0
              && (
                <>
                  <ErrorIcon styles={{ paddingLeft: "5rem" }} />
                  <Text
                    error
                    styles={{ paddingLeft: "0.5rem" }}
                  >
                    There was a problem loading
                    {" "}
                    {buildingUpn}
                    .Please choose another building from the menu
                  </Text>
                </>
              )}
      </Flex>
      <Flex hAlign="center" vAlign="center" style={{ marginTop: "8px" }}>
        {placesLoading && skipTokenString === ""
          && (<Loader />)}
      </Flex>
      <Box styles={{ padding: "16px 0" }}>
        <RepeatingBox>
          {sortedPlaces.map((place: ExchangePlace, index: number) => (
            <PlaceCard
              place={place}
              buildingName={place.building}
              key={place.identity + place.capacity + index.toString()}
            />
          ))}
        </RepeatingBox>
      </Box>

      <Flex hAlign="center" vAlign="center" style={{ marginTop: "8px" }}>
        {placesLoading && skipTokenString !== ""
        && (<Loader />)}
      </Flex>
      <Flex
        hAlign="center"
        style={{
          margin: "16px, 0",
        }}
      >
        {hasMore && (
          <Button
            content="Show more"
            onClick={() => {
              increasePageSize();
              logEvent(USER_INTERACTION, [
                { name: UI_SECTION, value: UISections.BookPlaceModal },
                { name: DESCRIPTION, value: "requestWorkspaces" },
              ]);
            }}
          />
        ) }
      </Flex>
      <Flex hAlign="center" vAlign="center" style={{ marginTop: "8px" }}>
        {placesLoading && hasMore === false && skipTokenString === ""
              && (
              <Text style={{
                color: theme.siteVariables.colors.grey[400],
              }}
              >
                No more results
              </Text>
              )}
      </Flex>
      <Box className={classes.isThisHelpful}>
        <IsThisHelpful logId="3938cd30" sectionName={UISections.PlaceResults} />
      </Box>
    </Flex>
  );
};

export default BuildingPlaces;
