import { makeStyles } from "@fluentui/react-theme-provider";

const WeekdayButtonStyles = makeStyles(() => ({
  popupText: {
    marginTop: "auto", marginBottom: "auto", marginLeft: "5px",
  },
  popupContainer: {
    marginLeft: "30px", display: "flex", alignItems: "center",
  },
  availableTimeButton: {
    "& .ui-button__content": {
      color: "#6264A7",
    },
    marginRight: "10px",
  },
}));

export default WeekdayButtonStyles;
