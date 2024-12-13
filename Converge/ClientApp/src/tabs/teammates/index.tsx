import React from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  CalendarAgendaIcon,
  Checkbox,
  ChevronDownMediumIcon,
  ChevronEndMediumIcon,
  ChevronStartIcon,
  DateRangeType,
  Datepicker,
  DatepickerProps,
  Flex,
} from "@fluentui/react-northstar";
import DisplayBox from "../home/DisplayBox";
import TeammateCardGallery from "./components/TeammateCardGallery";

enum Actions {
  backwards = "Backwards",
  forwards = "Forwards",
}

const Teammates: React.FC = () => {
  const [week, setWeek] = React.useState(dayjs().week());
  const [year, setYear] = React.useState(dayjs().year());
  const [showDaysOff, setShowDaysOff] = React.useState(false);
  const [pickerContent, setPickerContent] = React.useState(
    `Week ${week} - ${dayjs().week(week).weekday(0).format("MMMM")} ${dayjs().week(week).weekday(0).format("YYYY")}`,
  );
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

  React.useEffect(() => {
    setPickerContent(
      `Week ${week} - ${dayjs().week(week).weekday(0).format("MMMM")} ${dayjs().week(week).weekday(0).format("YYYY")}`,
    );
  }, [week]);

  return (
    <>
      <Box
        styles={{
          display: "grid",
          padding: "1em 1.5em",
          gridTemplateColumns: "1fr",
          gridTemplateAreas: "'Teammates'",
          height: "fit-content",
          minHeight: "350px",
        }}
      >
        <DisplayBox
          headerContent="Connect with teammates in your network"
          descriptionContent="Improve team collaboration by spending time with people in your network"
          gridArea="Teammates"
        >
          <Flex space="between" styles={{ maxWidth: "83%" }}>
            <Box style={{
              display: "flex",
              marginTop: "20px",
            }}
            >
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
              <Box style={{
                display: "flex",
                alignItems: "center",
                padding: "2px 20px 0px 20px",
              }}
              >
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
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Flex gap="gap.small" hAlign="end">
                <Checkbox
                  style={{
                    display: "flex",
                    marginLeft: "10px",
                  }}
                  checked={showDaysOff}
                  labelPosition="end"
                  label={(
                    <span style={{ marginLeft: "10px" }}>
                      {showDaysOff ? "Hide days-off" : "Show days-off"}
                    </span>
                  )}
                  onChange={() => setShowDaysOff(!showDaysOff)}
                  toggle
                />

              </Flex>
            </Box>
          </Flex>
          <TeammateCardGallery
            week={week}
            year={year}
            showDaysOff={showDaysOff}
          />
        </DisplayBox>
      </Box>
    </>
  );
};

export default Teammates;
