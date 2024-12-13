import React, { useState, useEffect } from "react";
import {
  RadioGroup, Text, Input, Divider, Dropdown, Box, Loader, Button,
} from "@fluentui/react-northstar";
import LocationType from "../../../types/LocationType";
import LocationSettingStyles from "../styles/LocationSettingStyle";
import { useGetBuildingsByName } from "../../../hooks/useBuildings";
import { useGetConvergeSettings, useUpdateConvergeSettings } from "../../../hooks/useConvergeSettings";
import { LocationPreferences } from "../../../types/ConvergeSettings";
import BuildingPicker from "../../../utilities/BuildingPicker";
import BuildingBasicInfo from "../../../types/BuildingBasicInfo";

const locationTypes = [
  LocationType.InOffice,
  LocationType.Remote,
  LocationType.ScheduledOff,
];
const LocationSettings: React.FC = () => {
  const classes = LocationSettingStyles();
  const [loading, setLoading] = useState(true);
  const [loadingInstance, setLoadingInstance] = useState<string>("");
  const [defaultLocation, setdefaultLocation] = useState<string | undefined>(LocationType.InOffice);
  const [defaultBuilding, setDefaultBuilding] = useState<BuildingBasicInfo| undefined>(undefined);
  const [zipCode, setZipCode] = useState<string | undefined>("");
  const { data: buildings } = useGetBuildingsByName();
  const { data: convergeSettings, refetch } = useGetConvergeSettings();
  const { mutate } = useUpdateConvergeSettings();

  const items = [
    {
      name: "inoffice",
      key: "InOffice",
      label: "In-office",
      value: LocationType.InOffice,
    },
    {
      name: "remote",
      key: "Remote",
      label: "Remote",
      value: LocationType.Remote,
    },
    {
      name: "hybrid",
      key: "Hybrid",
      label: "Hybrid",
      value: LocationType.Hybrid,
    },
  ];

  const updateLocationPreference = (key: string, value: string) => {
    const newLocationSettings = {
      ...convergeSettings?.locationPreferences,
    } as LocationPreferences;

    const newSettings = {
      ...convergeSettings,
      locationPreferences: newLocationSettings,
      zipCode: zipCode ?? "",
    };

    setLoadingInstance(key);
    newLocationSettings[key] = value;
    mutate(newSettings, {
      onSuccess: () => {
        refetch();
        setLoadingInstance("");
      },
    });
  };

  const onZipCodeChange = () => {
    updateLocationPreference("zipCode", zipCode ?? "");
  };

  const onDefaultLocationChange = (bldg: BuildingBasicInfo | undefined) => {
    const campusUpn = bldg?.identity;
    updateLocationPreference("defaultBuilding", campusUpn ?? "");
    setDefaultBuilding(bldg);
  };

  const getLocationType = (): string => {
    switch (defaultLocation) {
      case LocationType.InOffice:
        return "In-office defaults";
      case LocationType.Hybrid:
        return "Hybrid defaults";
      case LocationType.Remote:
        return "Remote defaults";
      default:
        return "";
    }
  };

  useEffect(() => {
    if (convergeSettings) {
      if (convergeSettings?.locationPreferences) {
        const updatedPreferences: LocationPreferences = {
          ...convergeSettings.locationPreferences,
        };
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        days.forEach((day) => {
          if (!updatedPreferences[day]) {
            updatedPreferences[day] = (day === "saturday" || day === "sunday") ? LocationType.ScheduledOff : LocationType.Remote;
          }
        });
        const newSettings = {
          ...convergeSettings,
          locationPreferences: updatedPreferences,
        };
        mutate(newSettings, {
          onSuccess: () => {
            refetch();
            setLoadingInstance("");
          },
        });
      }
      if (buildings?.buildingsList && buildings.buildingsList.length > 0) {
        const bldg = buildings?.buildingsList.find((b) => (
          b.identity === convergeSettings?.locationPreferences?.defaultBuilding
          || b.displayName === convergeSettings?.locationPreferences?.defaultBuilding
        ));
        setdefaultLocation(convergeSettings?.locationPreferences?.defaultLocation);
        setDefaultBuilding(bldg);
        setZipCode(convergeSettings?.zipCode);
        setLoading(false);
      }
    }
  }, [convergeSettings, buildings]);

  if (loading) {
    return <Loader size="largest" label="Loading location settings..." labelPosition="below" />;
  }

  return (
    <>
      <h4>Location defaults</h4>
      <RadioGroup
        checkedValue={defaultLocation}
        items={items}
        onCheckedValueChange={(e, data) => {
          data?.value && setdefaultLocation(data.value as string);
          data?.value && updateLocationPreference("defaultLocation", data.value as string);
        }}
      />
      <Divider />
      <>
        <Text
          content={getLocationType()}
          className={classes.defaultTitle}
        />
      </>
      {defaultLocation === LocationType.Remote || defaultLocation === LocationType.Hybrid
        ? (
          <Box className={classes.defaultContainer}>
            <Box className={classes.dayContainer}>
              <Text
                content="Zip code :"
                className={classes.dayTitle}
              />
              <Input
                className={classes.zipcode}
                value={zipCode}
                onChange={(e, data) => {
                  setZipCode(data?.value);
                }}
              />
              <Button content="Save Zipcode" onClick={() => onZipCodeChange()} />
            </Box>
            {loadingInstance === "zipCode" && <Loader size="smallest" label="updating..." labelPosition="start" />}
          </Box>
        )
        : null}
      {defaultLocation === LocationType.InOffice || defaultLocation === LocationType.Hybrid
        ? (
          <Box className={classes.defaultContainer}>
            <Box className={classes.buildingContainer}>
              <Text
                content="Default Building :"
                className={classes.dayTitle}
              />
              <BuildingPicker
                headerTitle="Recent buildings"
                handleDropdownChange={onDefaultLocationChange}
                locationBuildingName={defaultBuilding?.displayName}
                width="375px"
                marginContent="10px"
                value={defaultBuilding}
                placeholderTitle="Select a building"
                buttonTitle="Show more"
                maxHeight="260px"
                backgroundColor="#F5F5F5"
                onSettings
              />
            </Box>
            {loadingInstance === "defaultBuilding" && <Loader size="smallest" label="updating..." labelPosition="start" />}
          </Box>
        )
        : null}
      <Text
        styles={{ paddingTop: "10px", fontStyle: "italic" }}
        content="Choose your default working location for each day."
        className={classes.description}
      />
      <Box className={classes.defaultContainer}>
        <Box className={classes.dayContainer}>
          <Text
            content="Monday: "
            className={classes.dayTitle}
          />
          <Dropdown
            items={locationTypes}
            defaultValue={convergeSettings?.locationPreferences?.monday
              || (
                defaultLocation === LocationType.InOffice
                  ? LocationType.InOffice
                  : LocationType.Remote
              )}
            onChange={(e, data) => {
              data?.value && updateLocationPreference("monday", data.value as string);
            }}
          />
        </Box>
        {loadingInstance === "monday" && <Loader size="smallest" label="updating..." labelPosition="start" />}
      </Box>
      <Box className={classes.defaultContainer}>
        <Box className={classes.dayContainer}>
          <Text
            content="Tuesday: "
            className={classes.dayTitle}
          />
          <Dropdown
            items={locationTypes}
            defaultValue={convergeSettings?.locationPreferences?.tuesday
              || (
                defaultLocation === LocationType.InOffice
                  ? LocationType.InOffice
                  : LocationType.Remote
              )}
            onChange={(e, data) => {
              data?.value && updateLocationPreference("tuesday", data.value as string);
            }}
          />
        </Box>
        {loadingInstance === "tuesday" && <Loader size="smallest" label="updating..." labelPosition="start" />}
      </Box>

      <Box className={classes.defaultContainer}>
        <Box className={classes.dayContainer}>
          <Text
            content="Wednesday: "
            className={classes.dayTitle}
          />
          <Dropdown
            items={locationTypes}
            defaultValue={convergeSettings?.locationPreferences?.wednesday
              || (
                defaultLocation === LocationType.InOffice
                  ? LocationType.InOffice
                  : LocationType.Remote
              )}
            onChange={(e, data) => {
              data?.value && updateLocationPreference("wednesday", data.value as string);
            }}
          />
        </Box>
        {loadingInstance === "wednesday" && <Loader size="smallest" label="updating..." labelPosition="start" />}
      </Box>

      <Box className={classes.defaultContainer}>
        <Box className={classes.dayContainer}>
          <Text
            content="Thursday: "
            className={classes.dayTitle}
          />
          <Dropdown
            items={locationTypes}
            defaultValue={convergeSettings?.locationPreferences?.thursday
              || (
                defaultLocation === LocationType.InOffice
                  ? LocationType.InOffice
                  : LocationType.Remote
              )}
            onChange={(e, data) => {
              data?.value && updateLocationPreference("thursday", data.value as string);
            }}
          />
        </Box>
        {loadingInstance === "thursday" && <Loader size="smallest" label="updating..." labelPosition="start" />}
      </Box>

      <Box className={classes.defaultContainer}>
        <Box className={classes.dayContainer}>
          <Text
            content="Friday: "
            className={classes.dayTitle}
          />
          <Dropdown
            items={locationTypes}
            defaultValue={convergeSettings?.locationPreferences?.friday
              || (
                defaultLocation === LocationType.InOffice
                  ? LocationType.InOffice
                  : LocationType.Remote
              )}
            onChange={(e, data) => {
              data?.value && updateLocationPreference("friday", data.value as string);
            }}
          />
        </Box>
        {loadingInstance === "friday" && <Loader size="smallest" label="updating..." labelPosition="start" />}
      </Box>

      <Box className={classes.defaultContainer}>
        <Box className={classes.dayContainer}>
          <Text
            content="Saturday: "
            className={classes.dayTitle}
          />
          <Dropdown
            items={locationTypes}
            defaultValue={convergeSettings?.locationPreferences?.saturday
              || LocationType.ScheduledOff}
            onChange={(e, data) => {
              data?.value && updateLocationPreference("saturday", data.value as string);
            }}
          />
        </Box>
        {loadingInstance === "saturday" && <Loader size="smallest" label="updating..." labelPosition="start" />}
      </Box>

      <Box className={classes.defaultContainer}>
        <Box className={classes.dayContainer}>
          <Text
            content="Sunday: "
            className={classes.dayTitle}
          />
          <Dropdown
            items={locationTypes}
            defaultValue={convergeSettings?.locationPreferences?.sunday
              || LocationType.ScheduledOff}
            onChange={(e, data) => {
              data?.value && updateLocationPreference("sunday", data.value as string);
            }}
          />
        </Box>
        {loadingInstance === "sunday" && <Loader size="smallest" label="updating..." labelPosition="start" />}
      </Box>
    </>
  );
};

export default LocationSettings;
