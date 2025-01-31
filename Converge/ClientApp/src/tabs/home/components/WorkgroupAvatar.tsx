// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from "react";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import {
  Avatar, AcceptIcon, WindowMinimizeIcon, CloseIcon,
  CircleIcon, ShiftActivityIcon, ArrowLeftIcon, Flex,
} from "@fluentui/react-northstar";
import PresenceAvailability from "../../../types/PresenceAvailability";
import WorkgroupAvatarStyles from "../styles/WorkgroupAvatarStyles";
import { useGetUserPhoto, useGetUserProfile } from "../../../hooks/useUserDetails";

interface Props {
  user: MicrosoftGraph.User
}

const getAvailabilityTitle = (availability: string | null | undefined): string => {
  let avail = availability as PresenceAvailability;
  if (!avail) {
    avail = PresenceAvailability.PresenceUnknown;
  }
  return PresenceAvailability[avail];
};

const getAvailabilityIcon = (availability: string | null | undefined): JSX.Element => {
  let avail = availability as PresenceAvailability;
  if (!avail) {
    avail = PresenceAvailability.PresenceUnknown;
  }

  const presenceAvailabilityColors: {[TKey in PresenceAvailability]: JSX.Element | undefined} = {
    [PresenceAvailability.Available]: <AcceptIcon />,
    [PresenceAvailability.AvailableIdle]: <AcceptIcon />,
    [PresenceAvailability.Away]: <ShiftActivityIcon />,
    [PresenceAvailability.BeRightBack]: <ShiftActivityIcon />,
    [PresenceAvailability.Busy]: <CircleIcon styles={{ color: "#c4314b" }} />,
    [PresenceAvailability.BusyIdle]: <CircleIcon styles={{ color: "#c4314b" }} />,
    [PresenceAvailability.DoNotDisturb]: <WindowMinimizeIcon />,
    [PresenceAvailability.Offline]: <CloseIcon outline size="smallest" styles={{ color: "#ccc" }} />,
    [PresenceAvailability.PresenceUnknown]: <CircleIcon />,
    [PresenceAvailability.OutOfOffice]: <ArrowLeftIcon outline size="smallest" styles={{ color: "#ca4dbb" }} />,
  };
  return presenceAvailabilityColors[avail] || <AcceptIcon />;
};

const getAvailabilityColor = (
  availability: string | null | undefined,
): string | undefined => {
  let avail = availability as PresenceAvailability;
  if (!avail) {
    avail = PresenceAvailability.PresenceUnknown;
  }

  const presenceAvailabilityColors: {[TKey in PresenceAvailability]: string | undefined} = {
    [PresenceAvailability.Available]: "#92c353",
    [PresenceAvailability.AvailableIdle]: "#92c353",
    [PresenceAvailability.Away]: "#fcd116",
    [PresenceAvailability.BeRightBack]: "#fcd116",
    [PresenceAvailability.Busy]: "#c4314b",
    [PresenceAvailability.BusyIdle]: "#c4314b",
    [PresenceAvailability.DoNotDisturb]: "#c4314b",
    [PresenceAvailability.Offline]: "#FFF",
    [PresenceAvailability.PresenceUnknown]: "#959595",
    [PresenceAvailability.OutOfOffice]: "#FFF",
  };
  return presenceAvailabilityColors[avail];
};

const getAvailabilityBorderColor = (
  availability: string | null | undefined,
): string | undefined => {
  let avail = availability as PresenceAvailability;
  if (!avail) {
    avail = PresenceAvailability.PresenceUnknown;
  }

  const presenceAvailabilityColors: {[TKey in PresenceAvailability]: string | undefined} = {
    [PresenceAvailability.Available]: "#92c353",
    [PresenceAvailability.AvailableIdle]: "#92c353",
    [PresenceAvailability.Away]: "#fcd116",
    [PresenceAvailability.BeRightBack]: "#fcd116",
    [PresenceAvailability.Busy]: "#c4314b",
    [PresenceAvailability.BusyIdle]: "#c4314b",
    [PresenceAvailability.DoNotDisturb]: "#c4314b",
    [PresenceAvailability.Offline]: "rgb(105,105,105,0.15)",
    [PresenceAvailability.PresenceUnknown]: "#959595",
    [PresenceAvailability.OutOfOffice]: "rgb(202,77,187,0.15)",
  };
  return presenceAvailabilityColors[avail];
};

const WorkgroupAvatar: React.FC<Props> = (props) => {
  const {
    user,
  } = props;
  const [image, setImage] = useState<string | undefined | null>(undefined);
  const [IsDisplayName, setDisplayName] = useState<string>("");
  const classes = WorkgroupAvatarStyles();
  const { data: userPhoto, isError } = useGetUserPhoto(user.userPrincipalName as string);
  const { data: userProfile } = useGetUserProfile(user.userPrincipalName as string);

  useEffect(() => {
    if (isError) {
      if (user.userPrincipalName?.split(" ")[1] !== undefined) {
        setDisplayName(`${user.userPrincipalName.split(" ")[0][0]}${user.userPrincipalName.split(" ")[1][0]}`);
      }
      if (user.userPrincipalName?.split(" ")[1] !== undefined) {
        setDisplayName(`${user.userPrincipalName.split(" ")[0]}${user.userPrincipalName.split(" ")[1]}`);
      }
    }
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [user.userPrincipalName]);

  useEffect(() => {
    if (userPhoto) {
      setImage(userPhoto.userPhoto);
    }
  }, [userPhoto]);

  return (
    <Flex>
      {IsDisplayName
        ? (
          <Flex className={classes.displyName}>
            <p className={classes.name}>
              {IsDisplayName}
            </p>
          </Flex>
        )
        : (
          <Avatar
            name={user.displayName || ""}
            image={image}
            status={{
              color: getAvailabilityColor(userProfile?.presence.Availability),
              icon: getAvailabilityIcon(userProfile?.presence.Availability),
              title: getAvailabilityTitle(userProfile?.presence.Availability),
              styles: {
                border: `"1px solid ${getAvailabilityColor(userProfile?.presence.Availability)}"`,
                borderColor: `${getAvailabilityBorderColor(userProfile?.presence.Availability)}`,
                "& .ui-icon": {
                  backgroundColor: "transparent",
                },
                "& .ui-icon > svg": {
                  fill: "currentColor",
                },
              },
            }}
          />
        )}
    </Flex>
  );
};

export default WorkgroupAvatar;
