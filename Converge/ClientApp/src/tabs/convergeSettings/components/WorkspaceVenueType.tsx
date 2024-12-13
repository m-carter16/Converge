import React from "react";
import {
  Checkbox, Label, Flex, Box,
} from "@fluentui/react-northstar";
import VenueTypeStyles from "../styles/VenueTypeStyles";
import { useGetAdminSettings, useSetAdminSettings } from "../../../hooks/useAdminSettings";

const WorkspaceVenueType: React.FC = () => {
  const classes = VenueTypeStyles();
  const { data: adminSettings, refetch } = useGetAdminSettings();
  const { mutate } = useSetAdminSettings();

  const updateWorkSpaceSettings = (val: boolean) => {
    const newSettings = {
      ...adminSettings,
      workspaceEnabled: val,
    };
    mutate(newSettings, {
      onSuccess: refetch,
    });
  };

  return (
    <Flex gap="gap.medium" column>
      <Box>
        <Checkbox
          className={classes.workspaces}
          defaultChecked={adminSettings?.workspaceEnabled}
          label="Workspaces"
          toggle
          onClick={(ev, val) => {
            if (val) {
              updateWorkSpaceSettings(val.checked);
            }
          }}
          labelPosition="start"
        />
      </Box>
      <Label
        content={"These are the \"flexible\" spaces, not permanently assigned, aka desk hoteling."}
        color="white"
        fluid
      />
    </Flex>
  );
};

export default WorkspaceVenueType;
