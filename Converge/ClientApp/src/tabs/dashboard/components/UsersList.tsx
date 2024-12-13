import React from "react";
import { List, ListItemMediaProps, Checkbox } from "@fluentui/react-northstar";
import { makeStyles } from "@fluentui/react-theme-provider";
import { User } from "@microsoft/microsoft-graph-types";
import CardAvatar from "./CardAvatar";
import AvatarLocation from "./AvatarLocation";
import OfficeTeammate from "../../../types/OfficeTeammate";

interface IProps {
  users: OfficeTeammate[],
  selectedUsers: User[];
  setSelectedUsers: (users: User[]) => void;
  date?:Date;
}

interface IUser {
  key: string
  media: ListItemMediaProps,
  header: React.ReactNode,
  content: string,
}

const CollaborateHeaderStyles = makeStyles(() => ({
  root: {
    "& li.selected": {
      backgroundColor: "#ccc",
    },
  },

}));

const UsersList: React.FC<IProps> = (props) => {
  const {
    users, selectedUsers, setSelectedUsers, date,
  } = props;
  const [listItems, setListItems] = React.useState<IUser[]>([]);

  const classes = CollaborateHeaderStyles();

  const handleClick = (data: any) => {
    const selectedUser = users[data.selectedIndex].mate;
    const existingIndex = selectedUsers.findIndex((user) => user.id === selectedUser.id);

    if (existingIndex !== -1) {
      const newSelectedUsers = [...selectedUsers];
      newSelectedUsers.splice(existingIndex, 1);
      setSelectedUsers(newSelectedUsers);
    } else {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
  };

  const isSelected = (user: User): boolean => {
    if (selectedUsers && user) {
      return selectedUsers.some((x) => x.id === user.id);
    }
    return false;
  };

  const getUsersList = (() => {
    const items = users.map(
      (user) => (
        {
          key: user.mate.id,
          media: (
            <>
              <Checkbox checked={isSelected(user.mate)} />
              <CardAvatar user={user.mate} setUser={() => null} />
            </>
          ),
          header: (
            <>
              {user.mate.displayName}
              { date ? <AvatarLocation location={user.location} /> : null}
            </>
          ),
          content: user.mate.mail,
          selected: isSelected(user.mate),
          className: isSelected(user.mate) ? "selected" : "",
        } as IUser),
    );
    return items;
  });

  React.useEffect(() => {
    const items = getUsersList();
    setListItems(items);
  }, [users, selectedUsers]);

  return (
    <>
      {users.length
        ? (
          <List
            className={classes.root}
            items={listItems}
            selectable
            onSelectedIndexChange={(e, data) => handleClick(data)}
          />
        ) : null}
    </>
  );
};

export default UsersList;
