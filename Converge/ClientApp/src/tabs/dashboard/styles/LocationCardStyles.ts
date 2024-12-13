import { makeStyles } from "@fluentui/react-theme-provider";

const LocationCardStyles = makeStyles(() => ({
  modalStyle: {
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "white",
    zIndex: 9999,
    width: "100%",
    "& .ui-popup__content": {
      width: "110%",
    },
  },
  modalButtonStyle: {
    margin: "0px 0px 10px 0px",
    width: "100%",
    borderRadius: "15px !important",
  },
  textStyle: {
    fontWeight: 700,
    margin: "0 0 7px",
    display: "block",
    fontSize: "small",
    width: "180px",
    textAlign: "center",
  },
  inputStyle: {
    width: 40,
    marginRight: 20,
    marginLeft: 5,
    height: "28px",
    outline: "none",
    "& .ui-dropdown__container": {
      width: "80px",
    },
    "& .ui-dropdown__items-list": {
      width: "150px",
    },
    "& .ui-dropdown__searchinput__input": {
      padding: "5px 0px 5px 5px",
      fontWeight: 600,
    },
    "& .ui-dropdown__toggle-indicator": {
      padding: 0,
      margin: 0,
    },
    "& .ui-dropdown__selected-items": {
      paddingRight: "25px",
    },
  },
  labelStyle: {
    marginRight: "8px",
  },
  locationShimmer: {
    root: {
      backgroundColor: "black",
      width: "100%",
    },
  },
  shimmerGroup: {
    padding: "2px",
    minWidth: "215px",
    height: "50px",
  },
}));

export default LocationCardStyles;
