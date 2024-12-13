import {
  Box,
  ComponentEventHandler,
  Dropdown,
  DropdownProps,
  Flex,
  Input,
  InputProps,
  Loader,
  SearchIcon,
  Text,
} from "@fluentui/react-northstar";
import React, { useMemo } from "react";
import debounce from "lodash/debounce";
import {
  useGetMyDirectReports,
  useGetMyList, useGetMyOrganization, useGetPeople, useSearchUser,
} from "../../../hooks/useGetTeammates";
import {
  teammateFilterListFirst, TeammateList,
} from "../../../providers/TeammateFilterProvider";
import uid from "../../../utilities/UniqueId";
import TeammateGalleryStyles from "../styles/TeammateGalleryStyles";
import TeammateCard from "./TeammateCard";

interface TeammatesProps {
  week: number;
  year: number;
  showDaysOff: boolean;
}

const TeammateCardGallery: React.FC<TeammatesProps> = (props) => {
  const { week, year, showDaysOff } = props;
  const [enableSearch, setEnableSearch] = React.useState(false);
  const [searchString, setSearchString] = React.useState("");
  const [listValue, setListValue] = React.useState(TeammateList.MyOrganization.toString());
  const { data: searchUser, isLoading: searching } = useSearchUser(searchString);
  const { data: allPeople, isLoading: allPeopleLoading } = useGetPeople();
  const { data: myList, isLoading: myListLoading, refetch } = useGetMyList();
  const { data: MyOrganization, isLoading: myOrgLoading } = useGetMyOrganization();
  const { data: myDirectReports, isLoading: myReportsLoading } = useGetMyDirectReports();
  const styles = TeammateGalleryStyles();

  const isLoading = searching
    || allPeopleLoading || myListLoading || myOrgLoading || myReportsLoading;

  const teammates = useMemo(
    () => {
      switch (listValue) {
        case TeammateList.Suggested:
          return allPeople;
        case TeammateList.MyList:
          return myList;
        case TeammateList.MyOrganization:
          return MyOrganization;
        case TeammateList.DirectReports:
          return myDirectReports;
        case TeammateList.All:
          return searchUser?.users;
        default:
          return null;
      }
    }, [listValue, allPeople, myList, MyOrganization, searchUser, myDirectReports],
  );

  const handleDropdownChange = (
    event: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element> | null,
    { value }: DropdownProps,
  ) => {
    setListValue(value?.toString() ?? "");
    const eventData = value?.toString() as TeammateList;
    if (eventData === TeammateList.All) {
      setEnableSearch(true);
    } else {
      setEnableSearch(false);
    }
  };

  const handleSearch: ComponentEventHandler<InputProps & {
    value: string;
  }> = (event, data) => {
    setSearchString(data?.value as string);
    setListValue(TeammateList.All);
  };

  return (
    <>
      <Box style={{ display: "flex", marginTop: "20px", maxWidth: "83%" }}>
        <Dropdown
          className={styles.dropdownStyles}
          items={teammateFilterListFirst}
          value={listValue}
          checkable
          getA11ySelectionMessage={{
            onAdd: (item) => `${item} has been selected.`,
          }}
          onChange={handleDropdownChange}
        />
        {enableSearch
          ? (
            <Input
              style={{ marginLeft: "auto" }}
              icon={<SearchIcon />}
              placeholder="Search..."
              iconPosition="start"
              onChange={debounce(handleSearch, 1000)}
            />
          )
          : null}
      </Box>
      <Box style={{ margin: "15px 5px" }}>
        {
          // eslint-disable-next-line no-nested-ternary
          listValue === TeammateList.All
            ? (
              <Text
                content="Search by name or role to find someone"
                style={{ color: "#5B5FC7" }}
                weight="semibold"
                temporary
              />
            ) : teammates && teammates.length === 0
              ? (
                <Text
                  content="This list is empty"
                  style={{ color: "#5B5FC7" }}
                  weight="semibold"
                  temporary
                />
              ) : null
        }
      </Box>
      <Flex gap="gap.large" className={styles.container}>
        {
          // eslint-disable-next-line no-nested-ternary
          !isLoading || enableSearch
            ? (
              teammates?.map((user) => (
                <TeammateCard
                  key={uid()}
                  user={user}
                  week={week}
                  year={year}
                  date={new Date()}
                  showDaysOff={showDaysOff}
                  refetchMyList={refetch}
                />
              ))
            )
            : <Loader label="Loading..." labelPosition="end" />
        }
      </Flex>
    </>
  );
};

export default TeammateCardGallery;
