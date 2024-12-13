import { makeStyles } from "@fluentui/react-theme-provider";

const TeammateGalleryStyles = makeStyles(() => ({
  container: {
    flexWrap: "wrap",
    marginBottom: "10px 0",
    marginTop: "10px",
    maxWidth: "90%",
  },
  dropdownStyles: {
    marginTop: "12px",
    "& .ui-dropdown__container": {
      width: "200px",
    },
    "& .ui-dropdown__items-list": {
      width: "200px",
    },
  },
}));

export default TeammateGalleryStyles;
