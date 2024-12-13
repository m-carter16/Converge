import { makeStyles } from "@fluentui/react-theme-provider";

const NotificationSettingsStyles = makeStyles(() => ({
  notificationSettings: {
    "& .ui-checkbox__label": {
      fontWeight: "normal",
    },
    "& .ui-checkbox__indicator": {
      marginLeft: 20,
    },
  },
  labelSettings: {
    fontWeight: "bold",
  },
  dropDownSettings: {
    "& .ui-dropdown__trigger-button": {
      display: "block",
    },
  },
  timePickerStyles: {
    width: "100px",
    marginLeft: 20,
    "& .ms-Label": {
      fontSize: "12px",
      color: "#616161",
      fontWeight: "normal",
      paddingTop: 0,
    },
    "& .ms-ComboBox-Input, & .ms-ComboBox": {
      boxShadow: "none",
      backgroundColor: "#f3f2f1",
      maxWidth: "100px",
      height: "32px",
      fontWeight: "bold",
    },
    "& .ms-ComboBox::after": {
      border: "none",
    },
  },
  container: {
    display: "flex",
    margin: "24px 0",
    width: "30rem",
    justifyContent: "space-between",
  },
}));

export default NotificationSettingsStyles;
