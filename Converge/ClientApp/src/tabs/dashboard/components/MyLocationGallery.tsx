import {
  Box,
  Button,
  CalendarAgendaIcon,
  Checkbox,
  ChevronDownMediumIcon,
  ChevronEndMediumIcon,
  ChevronStartIcon,
  Datepicker,
  DatepickerProps,
  DateRangeType,
  Flex,
  Loader,
} from "@fluentui/react-northstar";
import React from "react";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useBoolean } from "@fluentui/react-hooks";
import LocationGalleryStyles from "../styles/LocationGalleryStyles";
import MyLocationCard from "./MyLocationCard";
import uid from "../../../utilities/UniqueId";
import UserLocation from "../../../types/UserLocation";
import LocationType from "../../../types/LocationType";
import { useGetMyWeeklyLocations } from "../../../hooks/usePrediction";

dayjs.extend(weekOfYear);

enum Actions {
  backwards = "Backwards",
  forwards = "Forwards",
}

interface MyLocationGalleryProps {
  week: number;
  year: number;
  setWeek: (week: number) => void;
  setYear: (year: number) => void;
}

const MyLocationGallery: React.FC<MyLocationGalleryProps> = (props) => {
  const {
    week, year, setWeek, setYear,
  } = props;
  const style = LocationGalleryStyles();
  const [checked, { toggle }] = useBoolean(false);
  const [pickerContent, setPickerContent] = React.useState(
    `Week ${week} - ${dayjs().week(week).weekday(0).format("MMMM")} ${dayjs().week(week).weekday(0).format("YYYY")}`,
  );
  const [locations, setLocations] = React.useState<UserLocation[] | undefined>([]);
  const { data: myWeeklyLocations, isLoading, refetch } = useGetMyWeeklyLocations(week, year);

  const handleToggle = () => {
    toggle();
  };

  const handleDateChange = (
    (event: React.SyntheticEvent, data: (DatepickerProps & { value: Date; }) | undefined) => {
      if (data) {
        const newWeek = dayjs(data.value).week();
        const newYear = dayjs(data.value).year();
        setWeek(newWeek);
        setYear(newYear);
      }
    });

  const handleNavigation = (action: string) => {
    if (action === Actions.forwards) {
      setWeek(week + 1);
      setYear(week + 1 === 1 ? year + 1 : year);
    } else if (action === Actions.backwards) {
      setWeek(week - 1);
      setYear(week - 1 === 52 ? year - 1 : year);
    }
  };

  // const handleRobinClick = () => {
  //   window.open("https://dashboard.robinpowered.com/autodesk/login", "_blank");
  // };

  const getWorkDays = (): UserLocation[] | undefined => {
    if (myWeeklyLocations) {
      let workDays = myWeeklyLocations.locationsList
        .filter((item) => item.name !== LocationType.ScheduledOff);

      if (workDays.length === 7) {
        workDays = myWeeklyLocations.locationsList
          .filter((item) => dayjs(item.date).day() !== 0 && dayjs(item.date).day() !== 6);
      }
      return workDays;
    }
    return [];
  };

  const getDaysOff = (): UserLocation[] | undefined => {
    if (myWeeklyLocations) {
      let daysOff = myWeeklyLocations.locationsList
        .filter((item) => item.name === LocationType.ScheduledOff);

      if (daysOff.length === 7) {
        daysOff = myWeeklyLocations.locationsList
          .filter((item) => dayjs(item.date).day() === 0 && dayjs(item.date).day() === 6);
      }
      return daysOff;
    }
    return [];
  };

  React.useEffect(() => {
    setPickerContent(
      `Week ${week} - ${dayjs().week(week).weekday(0).format("MMMM")} ${dayjs().week(week).weekday(0).format("YYYY")}`,
    );
  }, [week]);

  React.useEffect(() => {
    checked ? setLocations(getDaysOff()) : setLocations(getWorkDays());
  }, [checked, myWeeklyLocations]);

  return (
    <Box style={{ paddingTop: "30px", paddingBottom: "50px" }}>
      <div style={{ fontWeight: "bold", fontSize: "14px" }}>
        Update your location to inform teammates when you plan to be in-office
      </div>
      <Flex space="between" styles={{ maxWidth: "91%" }}>
        <Box className={style.wrapper}>
          <Button
            title="Today"
            content="Today"
            onClick={() => setWeek(dayjs().week())}
            icon={<CalendarAgendaIcon outline size="large" />}
            style={{ marginRight: "10px" }}
          />
          <Datepicker
            onDateChange={handleDateChange}
            today={dayjs().toDate()}
            dateRangeType={DateRangeType.Week}
            buttonOnly
            minDate={new Date()}
            popup={{
              trigger: <Button
                title="Select date"
                content={pickerContent}
                icon={<ChevronDownMediumIcon style={{ marginLeft: "25px", marginRight: "15px" }} />}
                iconPosition="after"
              />,
            }}
          />
          <Box className={style.chevronIcons}>
            <ChevronStartIcon
              styles={{ marginRight: "20px", cursor: "pointer" }}
              disabled={week === dayjs().week()}
              onClick={week === dayjs().week() ? undefined : () => { handleNavigation("Backwards"); }}
            />
            <ChevronEndMediumIcon
              styles={{ cursor: "pointer" }}
              onClick={() => { handleNavigation("Forwards"); }}
            />
          </Box>
        </Box>
        <Box className={style.toggleContainer}>
          <Flex gap="gap.small" hAlign="end">
            <Checkbox
              className={style.daysoffToggle}
              checked={checked}
              label={checked ? "Hide days-off" : "Show days-off"}
              onChange={handleToggle}
              toggle
            />
            {/* <Button
              styles={{ maxWidth: "215px" }}
              content="Book a space in Robin"
              tinted
              onClick={handleRobinClick}
            /> */}
          </Flex>
        </Box>
      </Flex>
      <Flex style={{ marginTop: "15px" }}>
        {!isLoading && locations && locations.length > 0
          ? locations.map((loc: UserLocation) => (
            <MyLocationCard
              key={uid()}
              location={loc}
              refetch={refetch}
            />
          ))
          : <Loader label="Loading..." labelPosition="end" /> }
      </Flex>
    </Box>
  );
};

export default MyLocationGallery;
