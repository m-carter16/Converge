// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { Alert } from "@fluentui/react-northstar";
import dayjs from "dayjs";
import * as React from "react";
import { useGetAdminSettings } from "../hooks/useAdminSettings";

const AppBanner: React.FC = () => {
  const [bannerMessage, setBannerMessage] = React.useState<string>("");
  const [bannerType, setBannerType] = React.useState<string>("");
  const [isExpired, setIsExpired] = React.useState(false);
  const query = useGetAdminSettings();

  React.useEffect(() => {
    if (query.data) {
      const currentDate = dayjs().startOf("day");
      const expiration = dayjs(query.data.appBannerExpiration).startOf("day");
      setIsExpired(expiration.isBefore(currentDate));
      setBannerMessage(query.data.appBannerMessage ?? "");
      setBannerType(query.data.appBannerType ?? "");
    }
  }, [query.data]);

  return (
    <>
      {(!isExpired && bannerMessage !== "") && (
        <>
          {bannerType === "info" && (<Alert info><span>{bannerMessage}</span></Alert>)}
          {bannerType === "warning" && (<Alert warning><span>{bannerMessage}</span></Alert>)}
          {bannerType === "success" && (<Alert success><span>{bannerMessage}</span></Alert>)}
          {bannerType === "danger" && (<Alert danger><span>{bannerMessage}</span></Alert>)}
          {bannerType === "urgent" && (<Alert variables={{ urgent: true }}><span>{bannerMessage}</span></Alert>)}
        </>
      )}
    </>
  );
};

export default AppBanner;
