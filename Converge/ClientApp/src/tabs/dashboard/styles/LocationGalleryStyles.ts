import { makeStyles } from "@fluentui/react-theme-provider";

const LocationGalleryStyles = makeStyles(() => ({
  iconMargin: {
    margin: 10,
  },
  container: {
    display: "flex",
    margin: "10px 0px 0px 0px",
    // maxWidth: "92%",
  },
  wrapper: {
    display: "flex",
    marginTop: "9px",
  },
  chevronIcons: {
    display: "flex",
    alignItems: "center",
    padding: "2px 20px 0px 20px",
  },
  toggleContainer: {
    display: "flex",
    alignItems: "end",
    paddingTop: "10px",
  },
  daysoffToggle: {
    display: "flex",
    marginTop: "2px",
    marginLeft: "10px",
  },
}));

export default LocationGalleryStyles;
