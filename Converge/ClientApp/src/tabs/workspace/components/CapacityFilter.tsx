// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import {
  Dropdown, DropdownMenuItemType, IDropdownOption, IDropdownStyles,
} from "@fluentui/react/lib/Dropdown";
import { Box } from "@fluentui/react-northstar";
import { FilterIcon } from "@fluentui/react-icons-northstar";
import { makeStyles } from "@fluentui/react-theme-provider";
import { useProvider as PlaceProvider } from "../../../providers/PlaceFilterProvider";
import { logEvent } from "../../../utilities/LogWrapper";
import {
  USER_INTERACTION, UISections, UI_SECTION, DESCRIPTION,
} from "../../../types/LoggerTypes";

const useDropdownStyles = makeStyles(() => ({
  lightTheme: {
    display: "flex",
    marginTop: "25px",
    paddingLeft: "5px",
    position: "relative",
    "& .ms-Dropdown, & .ms-Dropdown:hover > .ms-Dropdown-title, & .ms-Dropdown-title": {
      backgroundColor: "#fff",
      color: "#605D5A",
    },
  },
}));

const dropdownStyles: Partial<IDropdownStyles> = {
  callout: {
    "&.ms-Dropdown-callout": {
      width: 170,
    },
  },
  dropdown: {
    width: 125,
    ".ms-Dropdown-title": {
      border: "none",
      fontSize: "14px",
      fontWeight: "bold",
    },
    ".ms-Dropdown-caretDownWrapper": {
      display: "none",
    },
  },
  dropdownItems: {
    padding: "0 5px 10px 5px",
    ".ms-Dropdown-header": {
      color: "#000",
    },
    ".is-checked, .is-enabled": {
      border: "none",
      ".ms-Checkbox-label": {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        backgroundColor: "#fff",
      },
    },
    ".is-checked": {
      ".ms-Checkbox-checkbox": {
        backgroundColor: "#6264A7",
        borderColor: "#6264A7",
      },
    },
  },
  dropdownItem: {
    "&[title='Clear']": {
      position: "absolute",
      top: "0",
      right: "5px",
      width: "50%",
      color: "#6264A7",
      ".ms-Checkbox-checkbox": {
        display: "none",
      },
    },
  },
};

const iconStyles = { paddingBottom: "5px", margin: "0 5px" };

const CapacityFilter: React.FC = () => {
  const { updateCapacityFilter, state } = PlaceProvider();
  const [selectedItem, setSelectedItem] = React.useState<IDropdownOption>({ key: "", text: "" });
  const classes = useDropdownStyles();

  const dropdownOptions: IDropdownOption[] = [
    { key: "capacityHeader", text: "Capacity", itemType: DropdownMenuItemType.Header },
    { key: "divider_1", text: "-", itemType: DropdownMenuItemType.Divider },
    { key: "clear", text: "Clear", itemType: DropdownMenuItemType.Normal },
    { key: "1", text: "4 or less seats" },
    { key: "2", text: "5-9 seats" },
    { key: "3", text: "10 or more seats" },
  ];

  const onChange = (event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption | undefined): void => {
    logEvent(USER_INTERACTION, [
      { name: UI_SECTION, value: UISections.PlaceSearch },
      { name: DESCRIPTION, value: `filter_change_capacity_${option?.key}` },
    ]);
    if (!option) {
      return;
    }
    if (option.key === "clear") {
      setSelectedItem({ key: "", text: "" });
      updateCapacityFilter(0);
    } else {
      updateCapacityFilter(option.key as number);
    }
  };

  React.useEffect(() => {
    const selected = dropdownOptions.find((opt) => opt.key === state.capacityFilter);
    if (selected && selected.key !== "clear") {
      setSelectedItem(selected);
    }
  }, [state.capacityFilter]);

  const onRenderTitle = (): JSX.Element => (
    <div className="dropdownExample-placeholder">
      <FilterIcon styles={iconStyles} size="medium" />
      <span>
        {state.capacityFilter && state.capacityFilter > 0 ? "Capacity (1)" : "Capacity"}
      </span>
    </div>
  );

  const onRenderPlaceholder = (): JSX.Element => (
    <div className="dropdownExample-placeholder">
      <FilterIcon styles={iconStyles} size="medium" />
      <span>
        Capacity
      </span>
    </div>
  );

  return (
    <Box className={classes.lightTheme}>
      <Dropdown
        onRenderPlaceholder={onRenderPlaceholder}
        onChange={onChange}
        selectedKey={selectedItem.key}
        options={dropdownOptions}
        styles={dropdownStyles}
        onRenderTitle={onRenderTitle}
      />
    </Box>
  );
};

export default CapacityFilter;
