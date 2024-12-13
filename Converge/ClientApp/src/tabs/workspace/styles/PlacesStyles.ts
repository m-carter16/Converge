// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { makeStyles } from "@fluentui/react-theme-provider";

const PlacesStyles = makeStyles(() => ({
  headerBox: {
    borderBottom: "1px solid #E6E6E6",
    minHeight: "80px",
    marginBottom: ".6em",
  },
  isThisHelpful: {
    margin: "2.5em 0 0",
  },
  placeCardBox: {
    height: "49vh",
    overflowX: "auto",
  },
  cardBox: {
  },
  dropBox: {
    "& .ui-button": {
      width: "200px",
      borderRadius: "4px",
      backgroundColor: "rgb(245, 245, 245)",
      border: "0px",
      boxShadow: "none",
      marginTop: "4px",
    },
  },
  usersBox: {
    borderRadius: "4px",
    backgroundColor: "rgb(245, 245, 245)",
    border: "0px",
    boxShadow: "none",
    minWidth: "100px",
    display: "inline-block",
    padding: "2px",
  },
  usersTextField: {
    fontSize: "13px",
    margin: "5px",
    marginLeft: "10px",
    marginRight: "20px",
    display: "inline-block",
    lineHeight: "1.4",
  },
}));

export default PlacesStyles;
