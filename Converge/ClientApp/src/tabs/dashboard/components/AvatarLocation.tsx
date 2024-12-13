import React from "react";

interface IProps {
  location: string
}

const AvatarLocation: React.FC<IProps> = (props) => {
  const { location } = props;
  return (

    <>
      <span style={{ color: "gray", marginLeft: "8px", float: "right" }}>
        <span>{location}</span>
      </span>
    </>
  );
};

export default AvatarLocation;
