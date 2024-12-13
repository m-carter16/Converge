import { makeStyles } from "@fluentui/react-theme-provider";

const OpportunityCardStyles = makeStyles({
  footer: {
    paddingLeft: 50,
  },
  cardContainer: {
    marginBottom: "5px !important",
    minWidth: "30% !important",
  },
  icon: {
    color: "#6264A7 !important",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
  },
  location: {
    "& .ui-text": {
      paddingLeft: "5px",
    },
    "& .ui-icon": {
      paddingLeft: 5,
      marginBottom: 5,
    },
  },
  menu: {
    "& .ui-menubutton__menu": {
      padding: 0,
    },
  },
});

export default OpportunityCardStyles;
