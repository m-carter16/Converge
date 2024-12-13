import * as React from "react";
import {
  Box,
  Button,
  Flex,
  RadioGroup,
  TextArea,
} from "@fluentui/react-northstar";
import { useGetAdminSettings, useSetAdminSettings } from "../../../hooks/useAdminSettings";

const ManageAppBanner: React.FC = () => {
  const [bannerMessage, setBannerMessage] = React.useState("");
  const [bannerType, setBannerType] = React.useState("info");
  const [disabled, setDisabled] = React.useState(true);
  const { data: adminSettings, refetch } = useGetAdminSettings();
  const { mutate } = useSetAdminSettings();

  const inputItems = [
    {
      key: "info",
      label: "Informational",
      value: "info",
    },
    {
      key: "warning",
      label: "Warning",
      value: "warning",
    },
    {
      key: "success",
      label: "Success",
      value: "success",
    },
    {
      key: "danger",
      label: "Danger",
      value: "danger",
    },
    {
      key: "urgent",
      label: "Urgent",
      value: "urgent",
    },
  ];

  const updateBanner = () => {
    const newAdminSetting = {
      ...adminSettings,
      appBannerMessage: bannerMessage,
      appBannerType: bannerType,
    };
    mutate(newAdminSetting, {
      onSuccess: refetch,
    });
    setDisabled(true);
  };

  const handleTypeChange = (ev: any, data: any) => {
    setBannerType(data.value);
    setDisabled(false);
  };

  const handleMessageChange = (ev: any, data: any) => {
    setBannerMessage(data.value);
    setDisabled(false);
  };

  React.useEffect(() => {
    if (adminSettings) {
      if (adminSettings.appBannerMessage !== bannerMessage) {
        setBannerMessage(adminSettings?.appBannerMessage ?? "");
      }
      if (adminSettings.appBannerType !== bannerType) {
        setBannerType(adminSettings?.appBannerType ?? "");
      }
    }
  }, [adminSettings]);

  return (
    <Flex gap="gap.medium" column>
      <Box>
        <TextArea
          fluid
          style={{ maxWidth: "50%", height: "65px" }}
          value={bannerMessage}
          maxLength={300}
          onChange={handleMessageChange}
        />
      </Box>
      <Box>
        <RadioGroup
          items={inputItems}
          checkedValue={bannerType}
          onCheckedValueChange={handleTypeChange}
        />
      </Box>
      <Button
        content="Update banner message"
        primary
        styles={{ width: "200px" }}
        onClick={updateBanner}
        disabled={disabled}
      />
    </Flex>
  );
};

export default ManageAppBanner;
