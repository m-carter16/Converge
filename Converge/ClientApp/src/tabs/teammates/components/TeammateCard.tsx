import React from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Loader,
  MenuButton,
  MenuItemProps,
  MenuProps,
  ShorthandCollection,
  ShorthandValue,
  Text,
} from "@fluentui/react-northstar";
import {
  AddIcon, MoreIcon, TrashCanIcon,
} from "@fluentui/react-icons-northstar";
import dayjs from "dayjs";
import { User } from "@microsoft/microsoft-graph-types";
import WorkgroupAvatar from "../../home/components/WorkgroupAvatar";
import OpportunityCardStyles from "../styles/TeammateCardStyles";
import uid from "../../../utilities/UniqueId";
import WeeklyViewButtons from "./WeeklyViewButtons";
import OpportunityCardKey from "./TeammateCardKey";
import LocationType from "../../../types/LocationType";
import UserLocation from "../../../types/UserLocation";
import { useGetConvergeSettings, useUpdateConvergeSettings } from "../../../hooks/useConvergeSettings";
import { useGetWeeklyLocations } from "../../../hooks/usePrediction";
import TeammateCardLocation from "./TeammateCardLocation";
import WorkingHoursCell from "../../home/Table/WorkingHoursCell";
import TimeZoneCell from "../../home/Table/TimeZoneCell";
import TeammateTime from "./TeammateTime";

interface TeammateCardProps {
  user: User;
  week: number;
  year: number;
  showDaysOff: boolean;
  date: Date;
  refetchMyList: () => void
}

const TeammateCard: React.FC<TeammateCardProps> = (props) => {
  const {
    user, week, year, showDaysOff, date, refetchMyList,
  } = props;
  const styles = OpportunityCardStyles();
  const { data: convergeSettings, refetch } = useGetConvergeSettings();
  const { mutate } = useUpdateConvergeSettings();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [locations, setLocations] = React.useState<UserLocation[] | undefined>([]);
  const { data: weeklyLocations, isLoading } = useGetWeeklyLocations(user.userPrincipalName ?? "", week, year);

  const handleMenuItemClick = (upn: string | undefined | null) => {
    if (upn) {
      let newList = convergeSettings?.myList ? [...convergeSettings.myList] : [];
      setLoading(true);
      if (!convergeSettings?.myList?.find((li) => li === upn)) {
        newList = convergeSettings?.myList ? convergeSettings.myList.concat([upn]) : [upn];
      } else {
        newList = convergeSettings.myList ? convergeSettings.myList.filter((li) => li !== upn) : [];
      }
      const newSettings = { ...convergeSettings, myList: newList };
      mutate(newSettings, {
        onSuccess: () => {
          refetch();
          refetchMyList();
          setLoading(false);
        },
      });
    }
  };

  const getMenu = (isOnMyList: boolean) => {
    const menu: ShorthandValue<MenuProps> | ShorthandCollection<MenuItemProps> = [];
    if (isOnMyList) {
      menu.push(<Button key={uid()} size="small" icon={<TrashCanIcon size="small" />} circular text iconOnly content="Remove from my list" />);
    } else {
      menu.push(<Button key={uid()} size="small" icon={<AddIcon size="small" />} circular text iconOnly content="Add to my list" />);
    }
    return menu;
  };

  const getWorkDays = (): UserLocation[] | undefined => {
    if (weeklyLocations) {
      let workDays = weeklyLocations.locationsList
        .filter((item) => item.name !== LocationType.ScheduledOff);

      if (workDays.length === 7) {
        workDays = weeklyLocations.locationsList
          .filter((item) => dayjs(item.date).day() !== 0 && dayjs(item.date).day() !== 6);
      }
      return workDays;
    }
    return [];
  };

  const getDaysOff = (): UserLocation[] | undefined => {
    if (weeklyLocations) {
      let daysOff = weeklyLocations.locationsList
        .filter((item) => item.name === LocationType.ScheduledOff);

      if (daysOff.length === 0) {
        daysOff = weeklyLocations.locationsList
          .filter((item) => dayjs(item.date).day() === 0 || dayjs(item.date).day() === 6);
      }
      return daysOff;
    }
    return [];
  };

  React.useEffect(() => {
    showDaysOff ? setLocations(getDaysOff()) : setLocations(getWorkDays());
  }, [showDaysOff, weeklyLocations]);

  return (
    <Card
      key={uid()}
      aria-roledescription="Opportunity card"
      className={styles.cardContainer}
      style={{
        boxShadow: "#b4b4b1 0px 2px 8px 0px",
        minHeight: 100,
        margin: "20px 15px 0px 0px",
        backgroundColor: "white",
        borderRadius: "15px",
      }}
    >
      <Card.Header fitted>
        <Flex space="between">
          <Flex gap="gap.small">
            <WorkgroupAvatar user={user} />
            <Flex space="between" column>
              <Flex space="between" gap="gap.small">
                <Text content={user.displayName} weight="bold" />
                <TeammateCardLocation user={user} />
              </Flex>
              <Box>
                <Text size="small" style={{ color: "#949494" }}>
                  <TeammateTime userId={user?.userPrincipalName as string} date={date} />
                  <Box style={{ display: "inline-flex", paddingLeft: "5px" }}>
                    <TimeZoneCell userId={user?.userPrincipalName as string} />
                    <span>&nbsp; - &nbsp;</span>
                    <WorkingHoursCell userId={user?.userPrincipalName as string} />
                  </Box>
                </Text>
              </Box>
            </Flex>
          </Flex>
          {loading ? <Loader size="small" /> : (
            <MenuButton
              className={styles.menu}
              trigger={(
                <Button
                  icon={<MoreIcon />}
                  circular
                  text
                  iconOnly
                  title="More options"
                />
              )}
              menu={getMenu((convergeSettings?.myList || []).includes(user.userPrincipalName || ""))}
              on="click"
              onMenuItemClick={
                () => handleMenuItemClick(user.userPrincipalName)
              }
            />
          )}
        </Flex>
      </Card.Header>
      <Card.Body>
        <WeeklyViewButtons user={user} locations={locations ?? []} isLoading={isLoading} />
      </Card.Body>
      <Card.Footer fitted className={styles.footer}>
        <OpportunityCardKey />
      </Card.Footer>
    </Card>
  );
};
export default TeammateCard;
