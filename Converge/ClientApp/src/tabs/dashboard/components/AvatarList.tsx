import * as microsoftTeams from "@microsoft/teams-js";
import React from "react";
import { mergeStyleSets } from "@fluentui/react/lib/Styling";
import { Dialog, Button } from "@fluentui/react-northstar";
import { CloseIcon } from "@fluentui/react-icons-northstar";
import { User } from "@microsoft/microsoft-graph-types";
import dayjs from "dayjs";
import UsersList from "./UsersList";
import CardAvatar from "./CardAvatar";
import uid from "../../../utilities/UniqueId";
import createDeepLink from "../../../utilities/deepLink";
import useGetAppSettings from "../../../hooks/useAppSettings";
import OfficeTeammate from "../../../types/OfficeTeammate";

const styles = mergeStyleSets({
  container: {
    maxWidth: 300,
  },
  control: {
    paddingTop: 20,
  },
  slider: {
    margin: "10px 0",
  },
  dropdown: {
    paddingTop: 0,
    margin: "10px 0",
  },
});

interface AvatartListProps {
  officeTeammates: OfficeTeammate[];
  isLoading: boolean;
  locationDate?: Date;
  userLocation?: string;
}

const AvatarList: React.FC<AvatartListProps> = (props) => {
  const {
    officeTeammates, isLoading, locationDate, userLocation,
  } = props;
  const [open, setOpen] = React.useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([]);
  const { data: appSettings } = useGetAppSettings();

  const handleAvatarClick = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setOpen(true);
  };

  const handleCollaborate = () => {
    setOpen(false);
    const day = dayjs(locationDate);
    microsoftTeams.executeDeepLink(
      createDeepLink("places", {
        location: userLocation ?? "",
        date: dayjs(day).toDate()?.valueOf().toString() ?? "",
        users: selectedUsers.map((user) => user.userPrincipalName).join("!"),
      }, appSettings?.clientId ?? ""),
    );
  };

  return (
    <div className={styles.container}>
      <>
        <>
          {officeTeammates && officeTeammates.slice(0, 5).map((user) => (
            <CardAvatar
              key={uid()}
              user={user.mate}
              isLoading={isLoading}
              setUser={(u) => handleAvatarClick(u)}
            />
          ))}

          {officeTeammates && officeTeammates.length > 5
            && (
              <Button
                circular
                content={`+${officeTeammates.length - 5}`}
                title="More users"
                onClick={() => setOpen(true)}
              />
            )}
        </>
      </>
      <Dialog
        open={open}
        onOpen={() => setOpen(true)}
        confirmButton="Connect"
        onConfirm={handleCollaborate}
        content={
          (
            <UsersList
              users={officeTeammates}
              selectedUsers={selectedUsers}
              setSelectedUsers={setSelectedUsers}
              date={locationDate}
            />
          )
        }
        headerAction={{ icon: <CloseIcon />, title: "Close", onClick: () => setOpen(false) }}
      />
    </div>
  );
};

export default AvatarList;
