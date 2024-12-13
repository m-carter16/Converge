import React, { useEffect, useState } from "react";
import {
  Checkbox, Label, Flex, Box, Divider, Dropdown, DropdownProps,
} from "@fluentui/react-northstar";
import { IComboBox, IComboBoxOption, TimePicker } from "@fluentui/react";
import NotificationSettingsStyles from "../styles/NotificationSettingsStyles";
import { ConvergeSettings, NotificationPreferences } from "../../../types/ConvergeSettings";
import { useGetConvergeSettings, useUpdateConvergeSettings } from "../../../hooks/useConvergeSettings";

const NotificationSettings: React.FC = () => {
  const { data, refetch } = useGetConvergeSettings();
  const { mutate } = useUpdateConvergeSettings();
  // eslint-disable-next-line max-len
  const [notificationPreference, setNotificationPreferences] = useState<NotificationPreferences>({});
  const [frequencyValue, setFrequencyValue] = useState<string>("");
  const [dayValue, setDay] = useState<string>("");
  const [defaultTime, setDefaultTime] = useState<string>("");
  const classes = NotificationSettingsStyles();

  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = 30 - (minutes % 30);
  now.setMinutes(minutes + roundedMinutes);
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const currentTime = formatter.format(now).toLocaleLowerCase();

  const frequencyItems = [
    "Real-Time",
    "Daily",
    "Weekly",
  ];

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    if (data) {
      setNotificationPreferences(data.notificationPreferences || {});
      setFrequencyValue(data?.notificationPreferences?.frequency as string);
      setDay(data?.notificationPreferences?.day as string);
    }
  }, [data]);

  useEffect(() => {
    if (data?.notificationPreferences?.time) {
      setDefaultTime(data.notificationPreferences.time);
    } else {
      setDefaultTime(currentTime);
    }
  }, [data?.notificationPreferences?.time]);

  const updateNotificationSettings = ({ notificationPreferences } : ConvergeSettings) => {
    const updatedSettings = { ...data, notificationPreferences };
    mutate(updatedSettings, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const updateNotificationPreference = (preference: string, value: boolean) => {
    setNotificationPreferences((prevPreferences) => ({
      ...prevPreferences,
      [preference]: value,
    }));

    updateNotificationSettings({
      ...data,
      notificationPreferences: {
        ...data?.notificationPreferences,
        [preference]: value,
      },
    });
  };

  const onFrequencyChange = (
    event: React.MouseEvent | React.KeyboardEvent | null,
    datas: DropdownProps,
  ) => {
    setFrequencyValue(datas.value as string);
    if (datas.value === "Real-Time") {
      updateNotificationSettings({
        ...data,
        notificationPreferences: {
          ...data?.notificationPreferences,
          frequency: datas.value as string,
          time: undefined,
          day: undefined,
        },
      });
    }
    if (datas.value === "Daily") {
      updateNotificationSettings({
        ...data,
        notificationPreferences: {
          ...data?.notificationPreferences,
          frequency: datas.value as string,
          time: currentTime,
          day: undefined,
        },
      });
    }
  };

  const onDayChange = (
    event: React.MouseEvent | React.KeyboardEvent | null,
    datas: DropdownProps,
  ) => {
    setDay(datas?.value as string);
    updateNotificationSettings({
      ...data,
      notificationPreferences: {
        ...data?.notificationPreferences,
        frequency: frequencyValue,
        time: defaultTime,
        day: datas?.value as string,
      },
    });
  };

  const timeChangeHandler = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
  ) => {
    if (frequencyValue === "Daily") {
      updateNotificationSettings({
        ...data,
        notificationPreferences: {
          ...data?.notificationPreferences,
          frequency: frequencyValue,
          time: option?.text,
          day: undefined,
        },
      });
    } else if (frequencyValue === "Weekly" && dayValue !== "") {
      updateNotificationSettings({
        ...data,
        notificationPreferences: {
          ...data?.notificationPreferences,
          frequency: frequencyValue,
          time: option?.text,
          day: dayValue,
        },
      });
    }
  };

  return (
    <>
      <h4>Notification Settings</h4>
      <Flex gap="gap.medium" column className={classes.container}>
        <Label
          className={classes.labelSettings}
          content="Email"
          color="white"
          fluid
        />
        <Box>
          <Checkbox
            className={classes.notificationSettings}
            checked={notificationPreference.email ?? false}
            label="Send 'opportunity to connect' notification via email"
            toggle
            onClick={() => {
              updateNotificationPreference("email", !notificationPreference.email);
            }}
            labelPosition="start"
            style={{ display: "flex", justifyContent: "space-between" }}
          />
        </Box>
        <Divider />
        <Label
          className={classes.labelSettings}
          content="Teams Chat"
          color="white"
          fluid
        />
        <Box>
          <Checkbox
            className={classes.notificationSettings}
            checked={notificationPreference.teams ?? false}
            label="Send 'opportunity to connect' notification via Teams Chat"
            toggle
            onClick={() => {
              updateNotificationPreference("teams", !notificationPreference.teams);
            }}
            labelPosition="start"
            style={{ display: "flex", justifyContent: "space-between" }}
          />
        </Box>
        <Divider />
        <Label
          className={classes.labelSettings}
          content="In-app"
          color="white"
          fluid
        />
        <Box>
          <Checkbox
            className={classes.notificationSettings}
            checked={notificationPreference.inApp ?? false}
            label="Show 'opportunities to connect' notification via banner in app."
            toggle
            onClick={() => {
              updateNotificationPreference("inApp", !notificationPreference.inApp);
            }}
            labelPosition="start"
            style={{ display: "flex", justifyContent: "space-between" }}
          />
          <br />
          <div style={{ paddingLeft: "4px", fontStyle: "italic" }}>
            Note: Opportunities shown will be for the following day and will
            <br />
            not follow frequency selected below.
          </div>
        </Box>
        <Divider />
        <Label
          className={classes.labelSettings}
          content="Frequency"
          color="white"
          fluid
        />
        <Box style={{ display: "flex", justifyContent: "space-between" }}>
          <Label
            content="Notifications to be sent"
            color="white"
            fluid
          />
          <Dropdown
            className={classes.dropDownSettings}
            items={frequencyItems}
            value={frequencyValue}
            checkable
            getA11ySelectionMessage={{
              onAdd: (item) => `${item} has been selected.`,
            }}
            onChange={onFrequencyChange}
            fluid
          />
        </Box>
        {frequencyValue === "Daily" && (
        <Box style={{ display: "flex", justifyContent: "space-between" }}>
          <Label
            content="Time"
            color="white"
            fluid
          />
          <TimePicker
            useHour12
            className={classes.timePickerStyles}
            allowFreeform
            onChange={timeChangeHandler}
            defaultValue={defaultTime}
          />
        </Box>
        )}
        {
          frequencyValue === "Weekly" && (
          <Box style={{ display: "flex", justifyContent: "space-between" }}>
            <Box style={{ display: "flex" }}>
              <Label
                content="Day"
                color="white"
                fluid
                style={{ marginRight: 15 }}
              />
              <Dropdown
                className={classes.dropDownSettings}
                items={days}
                placeholder="Select Day"
                value={dayValue ?? ""}
                checkable
                getA11ySelectionMessage={{
                  onAdd: (item) => `${item} has been selected.`,
                }}
                fluid
                onChange={onDayChange}
              />
            </Box>

            <Box style={{ display: "flex" }}>
              <Label
                content="Time"
                color="white"
                fluid
              />
              <TimePicker
                useHour12
                className={classes.timePickerStyles}
                allowFreeform
                onChange={timeChangeHandler}
                defaultValue={defaultTime}
              />
            </Box>
          </Box>
          )
        }
      </Flex>
    </>

  );
};

export default NotificationSettings;
