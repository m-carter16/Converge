import React from "react";
import { Avatar } from "@fluentui/react-northstar";
import { User } from "@microsoft/microsoft-graph-types";
import { useGetUserPhoto } from "../../../hooks/useUserDetails";

interface CardAvatarProps {
  user: User;
  isLoading?: boolean;
  setUser: (user: User) => void;
}

const CardAvatar: React.FC<CardAvatarProps> = (props) => {
  const { user, isLoading, setUser } = props;
  const {
    data: userPhoto,
    isLoading: photoLoading,
  } = useGetUserPhoto(user.userPrincipalName as string);

  return (
    <>
      {isLoading || photoLoading
        ? null // <Shimmer shimmerElements={shimmerElements} />
        : (
          <Avatar
            name={user.displayName || ""}
            image={userPhoto?.userPhoto}
            onClick={() => setUser(user)}
          />
        )}
    </>
  );
};

export default CardAvatar;
