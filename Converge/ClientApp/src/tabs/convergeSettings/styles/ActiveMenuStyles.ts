import { makeStyles } from "@fluentui/react-theme-provider";

const ActiveMenuStyles = makeStyles(() => ({
  activeMenu: {
    "& a.active": {
      background: "#f5f5f5",
      borderLeft: "3px solid #6264A7",
    },
  },
}));

export default ActiveMenuStyles;
