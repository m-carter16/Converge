import { makeStyles } from "@fluentui/react-theme-provider";

const LocationSettingStyles = makeStyles(() => ({
  description: {
    display: "block",
    paddingBottom: 6,
  },
  zipcode: {
    width: "11.5rem",
    "& .ui-input__input": {
      width: "100%",
      fontWeight: 600,
    },
  },
  buildingContainer: {
    display: "flex",
    margin: "14px 0",
    width: "30rem",
  },
  defaultTitle: {
    fontWeight: 700,
    margin: "14px 0 7px",
    display: "block",
  },
  dayTitle: {
    display: "block",
    padding: "4px 20px 0 0",
  },
  dayContainer: {
    display: "flex",
    margin: "14px 0",
    width: "30rem",
    justifyContent: "space-between",
  },
  defaultContainer: {
    display: "flex",
  },
}));

export default LocationSettingStyles;
