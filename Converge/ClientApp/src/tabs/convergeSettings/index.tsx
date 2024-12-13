import React, { useState, SyntheticEvent, useRef } from "react";
import {
  Box, Flex, Menu,
  MenuProps,
} from "@fluentui/react-northstar";
import { LocationIcon, SpotlightIcon, UrgentIcon } from "@fluentui/react-icons-northstar";
import DisplayBox from "../home/DisplayBox";
import ActiveMenuStyles from "./styles/ActiveMenuStyles";
import AdminSettings from "./components/AdminSettings";
import NotificationSettings from "./components/NotificationSettings";
import LocationSettings from "./components/LocationSettings";
import { useIsConvergeAdmin } from "../../hooks/useUserDetails";

enum EmptyStateTabs {
  NotificationsTab,
  LocationSettingsTab,
  AdminSettingsTab,
}

const ConvergeSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(EmptyStateTabs.LocationSettingsTab);
  const checked = useRef(false);
  const classes = ActiveMenuStyles();
  const { data: isConvergeAdmin, status } = useIsConvergeAdmin();

  if (status === "success") {
    if (checked.current !== isConvergeAdmin) {
      checked.current = isConvergeAdmin ?? false;
    }
  }

  const onActiveIndexChange = (
    e: SyntheticEvent<HTMLElement, Event>,
    menuProps?: MenuProps,
  ) => {
    switch (menuProps?.activeIndex) {
      case EmptyStateTabs.NotificationsTab:
        setActiveTab(EmptyStateTabs.NotificationsTab);
        break;
      case EmptyStateTabs.LocationSettingsTab:
        setActiveTab(EmptyStateTabs.LocationSettingsTab);
        break;
      case EmptyStateTabs.AdminSettingsTab:
        setActiveTab(EmptyStateTabs.AdminSettingsTab);
        break;
      default:
        break;
    }
  };

  return (
    <Box
      styles={{
        display: "grid",
        padding: "1em 1.5em",
        gridTemplateColumns: "1fr",
        gridTemplateAreas: "'ConvergeSettings'",
        height: "100vh",
      }}
    >
      <DisplayBox
        headerContent="Settings"
        gridArea="ConvergeSettings"
      >
        <Flex gap="gap.medium">
          <Box
            styles={{
              marginRight: 50,
            }}
          >
            <Menu
              className={classes.activeMenu}
              defaultActiveIndex={0}
              items={[
                {
                  icon: (
                    <UrgentIcon />
                  ),
                  key: "notifications",
                  content: "Notification Settings",
                  className: activeTab === EmptyStateTabs.NotificationsTab ? "active" : "",
                },
                {
                  icon: (
                    <LocationIcon />
                  ),
                  key: "location",
                  content: "Location Settings",
                  className: activeTab === EmptyStateTabs.LocationSettingsTab ? "active" : "",
                },
                checked.current
                && {
                  icon: <SpotlightIcon />,
                  key: "adminSettings",
                  content: "Admin Settings",
                  className: activeTab === EmptyStateTabs.AdminSettingsTab ? "active" : "",
                },
              ]}
              onActiveIndexChange={onActiveIndexChange}
              vertical
              pointing
            />
          </Box>
          <Box
            styles={{
              flexGrow: 1,
            }}
          >
            {activeTab === EmptyStateTabs.NotificationsTab && (
              <NotificationSettings />
            )}
            {activeTab === EmptyStateTabs.LocationSettingsTab && (
              <LocationSettings />
            )}
            {activeTab === EmptyStateTabs.AdminSettingsTab && (
              <AdminSettings />
            )}
          </Box>
        </Flex>
      </DisplayBox>
    </Box>
  );
};

export default ConvergeSettings;
