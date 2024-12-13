// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import {
  Popup, Button, LocationIcon,
  Input, ChevronDownIcon,
} from "@fluentui/react-northstar";
import BuildingPickerContent from "./BuildingPickerContent";
import { logEvent } from "./LogWrapper";
import {
  DESCRIPTION, UISections,
  UI_SECTION, USER_INTERACTION,
} from "../types/LoggerTypes";
import BuildingBasicInfo from "../types/BuildingBasicInfo";

interface Props {
  headerTitle: string,
  locationBuildingName: string | undefined,
  handleDropdownChange: (bldg: BuildingBasicInfo | undefined) => void;
  marginContent: string,
  width: string,
  value: BuildingBasicInfo | undefined,
  placeholderTitle: string,
  buttonTitle: string,
  maxHeight: string,
  clearTextBox?: (isValid: boolean) => void;
  onLocationCard?: boolean,
  onWelcome?: boolean,
  onSettings?: boolean,
  disabled?: boolean,
  isMutating?:boolean,
  backgroundColor?: string
}

const BuildingPicker: React.FunctionComponent<Props> = (props) => {
  const {
    headerTitle, width, marginContent, value,
    buttonTitle, maxHeight, placeholderTitle,
    onLocationCard, onWelcome, disabled, isMutating,
    locationBuildingName, backgroundColor, onSettings,
  } = props;
  const [popup, setPopup] = React.useState(false);

  const [selectedBuildingName, setSelectedBuildingName] = React.useState(
    onWelcome || onLocationCard ? value?.displayName : "",
  );

  const handleDropdownChange = (bldg: BuildingBasicInfo | undefined) => {
    setPopup(false);
    setSelectedBuildingName(bldg?.displayName ?? "");
    props.handleDropdownChange(bldg);
  };

  const onClickTextboxChange = () => {
    if (popup === true) setPopup(false);
    else setPopup(true);
    setSelectedBuildingName("");
  };
  const handleTextboxChange = (searchText: string | undefined) => {
    setPopup(true);
    setSelectedBuildingName(searchText || "");
    props.clearTextBox?.(true);
  };

  React.useEffect(() => {
    setSelectedBuildingName(value?.displayName ?? "");
  }, [value, locationBuildingName]);

  return (
    <Popup
      position="below"
      align="bottom"
      open={popup}
      onOpenChange={(_, callOutprops) => {
        const open = !!callOutprops?.open;
        setPopup(open);
      }}
      trigger={
        onLocationCard ? (
          <Button
            styles={{
              borderRadius: "15px",
              width: "100%",
              alignItems: "center",
            }}
            disabled={disabled}
            icon={<LocationIcon outline />}
            content={selectedBuildingName}
            iconPosition="before"
            loading={isMutating}
          />
        ) : (
          <Input
            inverted={onWelcome}
            icon={(
              <ChevronDownIcon onClick={() => {
                onClickTextboxChange();
                logEvent(USER_INTERACTION, [
                  {
                    name: UI_SECTION,
                    value: UISections.PopupMenuWrapper,
                  },
                  {
                    name: DESCRIPTION,
                    value: "ChevronDownIconClick",
                  },
                ]);
              }}
              />
            )}
            input={onSettings ? {
              styles: {
                fontWeight: "600",
              },
            } : null}
            wrapper={{
              styles: {
                width,
                backgroundColor,
                borderBottomWidth: width,
              },
            }}
            value={selectedBuildingName}
            clearable
            onChange={((event, data) => handleTextboxChange(data?.value))}
            placeholder={placeholderTitle}
          />
        )
      }
      content={{
        styles: {
          width,
          "& .ui-popup__content__content": { padding: "5px", marginLeft: marginContent },
          "& ul": { border: "none", width: "100%", padding: "5px 0" },
          "@media (max-width: 1366px)": {
            "& .ui-popup__content__content": { padding: "5px", marginLeft: "2.6rem" },
            "& ul": { border: "none", width: "100%", padding: "5px 0" },
          },

        },
        content: (
          <BuildingPickerContent
            headerTitle={headerTitle}
            handleDropdownChange={handleDropdownChange}
            selected={value}
            buttonTitle={buttonTitle}
            maxHeight={maxHeight}
          />
        ),
      }}
      // on={["context", "hover"]}
      on="click"
      pointing
    />
  );
};

export default BuildingPicker;
