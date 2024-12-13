import { makeStyles } from "@fluentui/react-theme-provider";

const InOfficeGraphStyles = makeStyles(() => ({
  graphContainer: {
    pointerEvents: "none",
    width: "50px",
    height: "50px",
  },
  detailContainer: {
    position: "relative",
    top: -33,
    left: 17,
  },
  groupIcon: {
    color: "#237B4B",
  },
}));

export default InOfficeGraphStyles;
