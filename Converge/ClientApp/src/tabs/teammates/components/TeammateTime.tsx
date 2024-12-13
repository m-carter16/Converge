import * as React from "react";
import dayjs from "dayjs";
import { Shimmer, ShimmerElementType } from "@fluentui/react";
import { useGetUserWorkingHours } from "../../../hooks/useUserDetails";
import convertTZ from "../../../utilities/TimezoneConversion";

export interface TeammateTimeProps {
  userId: string;
  date: Date;
}

const TeammateTime: React.FC<TeammateTimeProps> = (props) => {
  const { userId, date } = props;
  const { data: userWorkingHours, isLoading } = useGetUserWorkingHours(userId);
  const [today, setDate] = React.useState(date);
  const tzObj = JSON.parse(convertTZ);
  const parsedTimeZone = tzObj[userWorkingHours?.timeZone.name ?? ""];

  const shimmerElements = [
    { type: ShimmerElementType.line, width: "20px", height: 20 },
  ];

  const time = dayjs.tz(today, parsedTimeZone).format("h:mm A");

  React.useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 60 * 1000);
    return () => {
      // Return a funtion to clear the timer so that it will stop being called on unmount
      clearInterval(timer);
    };
  }, []);

  if (isLoading) {
    return <Shimmer shimmerElements={shimmerElements} />;
  }

  return (
    <>
      {time}
    </>
  );
};

export default TeammateTime;
