import React from "react";
import {
  Box,
  BuildingIcon,
  Button,
  Card, Flex, LeaveIcon, Loader, LocationIcon, Popup, Text,
} from "@fluentui/react-northstar";
import { Icon } from "office-ui-fabric-react";
import dayjs from "dayjs";
import { Shimmer, ShimmerElementType } from "@fluentui/react/lib/Shimmer";
import LocationType from "../../../types/LocationType";
import LocationCardStyles from "../styles/LocationCardStyles";
import InOfficeGraph from "./InOfficeGraph";
import BuildingPicker from "../../../utilities/BuildingPicker";
import { useUpdateMyPrediction } from "../../../hooks/usePrediction";
import UserPredictedLocationRequest from "../../../types/UserPredictedLocationRequest";
import AvatarList from "./AvatarList";
import { useGetMyTeammates, useGetOfficeTeammates } from "../../../hooks/useGetTeammates";
import BuildingBasicInfo from "../../../types/BuildingBasicInfo";
import UserLocation from "../../../types/UserLocation";

interface MyLocationCardProps {
  location: UserLocation,
  refetch: () => void,
}

const MyLocationCard: React.FC<MyLocationCardProps> = (props) => {
  const { location, refetch } = props;
  const startOfDate = dayjs(location.date).startOf("day");
  const isPast = startOfDate.isBefore(dayjs().startOf("day"));
  const [popup, setPopup] = React.useState(false);
  const [isInOffice, setInOffice] = React.useState(false);
  const [dayName, setDayName] = React.useState("");
  const [dayNumber, setDayNumber] = React.useState("");
  const [value, setValue] = React.useState({
    displayName: location.name,
    identity: location.uri,
  });
  const styles = LocationCardStyles();
  const { mutate, isLoading: isMutating } = useUpdateMyPrediction();
  const { data: teammates, isLoading: tmLoading } = useGetMyTeammates();
  const { data: officeTeammates, isLoading: otLoading } = useGetOfficeTeammates(location.date);

  const [icon, setIcon] = React.useState(<Loader
    size="smallest"
    labelPosition="start"
    style={{ alignItems: "center" }}
  />);

  const graphShimmerElements = [
    { type: ShimmerElementType.circle, height: 40 },
    { type: ShimmerElementType.gap, width: "2px" },
    { type: ShimmerElementType.line, width: "80%" },
  ];

  const shimmerElements = [
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.circle, height: 32 },
    { type: ShimmerElementType.circle, height: 32 },
  ];

  const updateDefaultBuilding = (bldg: BuildingBasicInfo | undefined) => {
    setValue({
      displayName: bldg?.displayName ?? "",
      identity: bldg?.identity ?? "",
    });
    const newPrediction: UserPredictedLocationRequest = {
      year: dayjs.utc(location.date).year(),
      month: dayjs.utc(location.date).month() + 1,
      day: dayjs.utc(location.date).date(),
      userPredictedLocation: {
        campusUpn: bldg?.identity,
      },
    };
    mutate(newPrediction, {
      onSuccess: refetch,
    });
  };

  const updateDefaultLocation = (bldg: "Remote" | "Out of Office") => {
    const newPrediction: UserPredictedLocationRequest = {
      year: dayjs.utc(location.date).year(),
      month: dayjs.utc(location.date).month() + 1,
      day: dayjs.utc(location.date).date(),
      userPredictedLocation: {
        campusUpn: undefined,
        otherLocationOption: bldg,
      },
    };
    mutate(newPrediction, {
      onSuccess: refetch,
    });
  };

  const onClickTextboxChange = () => {
    if (popup === true) setPopup(false);
    else setPopup(true);
  };

  const handleLocationChange = (newLocation : LocationType) => {
    onClickTextboxChange();
    if (newLocation === LocationType.InOffice) {
      setInOffice(true);
      setValue({
        displayName: "Select a building",
        identity: "",
      });
      setIcon(<BuildingIcon outline />);
    } else if (newLocation === LocationType.Remote) {
      updateDefaultLocation(LocationType.Remote);
      setInOffice(false);
      setIcon(<Icon iconName="Home" />);
    } else if (newLocation === LocationType.ScheduledOff) {
      updateDefaultLocation("Out of Office");
      setInOffice(false);
      setIcon(<LeaveIcon outline />);
    }
  };

  React.useEffect(() => {
    switch (location.name) {
      case LocationType.Remote:
        setIcon(<Icon iconName="Home" />);
        break;
      case LocationType.Hybrid:
        setIcon(<BuildingIcon outline />);
        break;
      case "Out of Office":
        setIcon(<LeaveIcon outline />);
        break;
      default:
        setIcon(<BuildingIcon outline />);
        break;
    }
    setInOffice(location.name !== "Remote" && location.name !== "Out of Office");
    setDayName(dayjs(location.date).format("dddd"));
    setDayNumber(dayjs(location.date).format("D"));
  }, [location]);

  return (
    <Card
      style={{
        boxShadow: `#b4b4b1
        0px 2px 8px 0px`,
        maxWidth: 230,
        minHeight: 300,
        margin: "10px 20px 0px 0px",
        backgroundColor: "white",
        borderRadius: "15px",
      }}
    >
      <Card.Header>
        <Flex gap="gap.smaller">
          <Flex>
            <Text
              size="large"
              weight="bold"
              content={dayNumber}
            />
          </Flex>
          <Flex styles={{ paddingTop: "3px" }}>
            <Text
              weight="bold"
              content={dayName}
            />
          </Flex>
        </Flex>
      </Card.Header>
      <Card.Body>
        <Flex column gap="gap.small" hAlign="center">
          <Popup
            position="below"
            align="bottom"
            open={popup}
            onOpenChange={(_, callOutprops) => {
              const open = !!callOutprops?.open;
              setPopup(open);
            }}
            trigger={(
              <Button
                styles={{
                  borderRadius: "15px",
                  width: "100%",
                  alignItems: "center",
                }}
                icon={icon}
                // eslint-disable-next-line no-nested-ternary
                content={isInOffice ? "In-office" : isMutating ? <Loader size="small" /> : location.name}
                disabled={isPast}
                iconPosition="before"
                secondary
              />
            )}
            content={(
              <Box className={styles.modalStyle}>
                <Text
                  content="Working location"
                  className={styles.textStyle}
                />
                <Button
                  className={styles.modalButtonStyle}
                  icon={<BuildingIcon outline />}
                  content="In-Office"
                  iconPosition="before"
                  secondary
                  onClick={() => handleLocationChange(LocationType.InOffice)}
                />
                <Button
                  className={styles.modalButtonStyle}
                  icon={<Icon iconName="Home" />}
                  content="Remote"
                  iconPosition="before"
                  secondary
                  onClick={() => handleLocationChange(LocationType.Remote)}
                />
                <Button
                  className={styles.modalButtonStyle}
                  icon={<LeaveIcon outline />}
                  content="Day Off"
                  iconPosition="before"
                  secondary
                  onClick={() => handleLocationChange(LocationType.ScheduledOff)}
                />
              </Box>
            )}
            on={["context", "hover"]}
            pointing
          />
          {
            // eslint-disable-next-line no-nested-ternary
            isInOffice
              ? (
                <div style={{ width: "100%" }}>
                  <BuildingPicker
                    headerTitle="Recent buildings"
                    handleDropdownChange={updateDefaultBuilding}
                    locationBuildingName=""
                    width="220px"
                    marginContent="0"
                    value={value}
                    disabled={isPast}
                    placeholderTitle="Select a building"
                    buttonTitle="Show more"
                    maxHeight="200px"
                    onLocationCard
                    isMutating={isMutating}
                  />
                </div>
              )
              : location.name === LocationType.Remote
                ? (
                  <Button
                    styles={{
                      borderRadius: "15px",
                      width: "100%",
                      alignItems: "center",
                    }}
                    icon={<LocationIcon outline />}
                    content="Home Office"
                    disabled={isPast}
                    iconPosition="before"
                    secondary
                  >
                    {isMutating ? <Loader size="small" /> : null}
                  </Button>
                )
                : null
          }
        </Flex>
      </Card.Body>
      <Card.Footer
        fitted
        styles={{
          position: "absolute",
          bottom: 0,
          paddingBottom: "5px",
          width: "100%",
        }}
      >
        {otLoading
          ? (
            <Shimmer shimmerElements={shimmerElements} width="70%" />
          ) : (
            <AvatarList
              officeTeammates={officeTeammates ?? []}
              isLoading={otLoading}
              userLocation={location.uri}
              locationDate={location.date}
            />
          )}
        {tmLoading && otLoading
          ? (
            <Box className={styles.shimmerGroup}>
              <Shimmer shimmerElements={graphShimmerElements} width="74%" />
            </Box>
          ) : (
            <InOfficeGraph
              officeTeammates={officeTeammates ? officeTeammates.length : 0}
              teammates={teammates ? teammates.length : 0}
            />
          )}
      </Card.Footer>
    </Card>
  );
};
export default MyLocationCard;
