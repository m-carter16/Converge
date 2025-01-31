// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { createContext, useContext, useReducer } from "react";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import TimeLimit from "../types/TimeLimit";
import { logEvent } from "../utilities/LogWrapper";
import {
  DESCRIPTION, OVERLAP_PERCENTAGE, USER_INTERACTION, ViralityMeasures, VIRALITY_MEASURE,
} from "../types/LoggerTypes";
import QueryOption from "../types/QueryOption";
import { useApiProvider } from "./ApiProvider";
import { useConvergeSettingsContextProvider } from "./ConvergeSettingsProvider";

export enum TeammateList {
  MyList = "My List",
  Suggested = "Suggested",
  MyOrganization = "My Team",
  DirectReports = "Direct Reports",
  All = "All",
}

export interface Teammate {
  user: MicrosoftGraph.User,
  location?: string,
  availableTimes?: TimeLimit[],
}

export interface TeammateListSettings {
  optionSelected: TeammateList,
  optionsOrdered: TeammateList[],
}

export const teammateFilterListFirst = [
  TeammateList.MyList,
  TeammateList.Suggested,
  TeammateList.DirectReports,
  TeammateList.MyOrganization,
  TeammateList.All,
];

export const teammateFilterSuggestedFirst = [
  TeammateList.Suggested,
  TeammateList.MyList,
  TeammateList.DirectReports,
  TeammateList.MyOrganization,
  TeammateList.All,
];

const UPDATE_LOCATION = "UPDATE_LOCATION";
const TEAMMATES_REQUEST = "TEAMMATES_REQUEST";
const TEAMMATES_RESPONSE = "TEAMMATES_RESPONSE";
const TEAMMATES_ERROR = "TEAMMATES_ERROR";
const UPDATE_LIST = "UPDATE_LIST";
const UPDATE_DATE = "UPDATE_DATE";
const UPDATE_SEARCH_STRING = "UPDATE_SEARCH_STRING";
const UPDATE_SEARCH_QUERY_OPTIONS = "UPDATE_SEARCH_QUERY_OPTIONS";
const SET_TEAMMATE_LOCATION = "SET_TEAMMATE_LOCATION";
const SET_MORE_TEAMMATES_LOADING = "SET_TEAMMATE_LOADING";
const SET_TEAMMATES_DROPDOWN = "SET_TEAMMATES_DROPDOWN";

interface UpdateTeammateLocationAction {
  type: typeof UPDATE_LOCATION,
  payload: string[],
}

interface UpdateDateAction {
  type: typeof UPDATE_DATE,
  payload: Date,
}

interface GetTeammatesRequestAction {
  type: typeof TEAMMATES_REQUEST,
}

interface GetTeammatesResponseAction {
  type: typeof TEAMMATES_RESPONSE,
  payload: Teammate[],
}

interface GetTeammatesErrorAction {
  type: typeof TEAMMATES_ERROR
}

interface UpdateListAction {
  type: typeof UPDATE_LIST,
  payload: TeammateList,
}

interface UpdateSearchString {
  type: typeof UPDATE_SEARCH_STRING,
  payload?: string,
}

interface UpdateSearchQueryOptions {
  type: typeof UPDATE_SEARCH_QUERY_OPTIONS,
  payload?: QueryOption[],
}

interface SetTeammateLocationAction {
  type: typeof SET_TEAMMATE_LOCATION,
  payload: { id: string, location: string }
}

interface SetMoreTeammateLoadingAction {
  type: typeof SET_MORE_TEAMMATES_LOADING,
  payload: boolean,
}

interface SetTeammatesDropdownAction {
  type: typeof SET_TEAMMATES_DROPDOWN,
  payload: TeammateList[],
}

type ITeammateAction = UpdateTeammateLocationAction
 | GetTeammatesRequestAction
 | GetTeammatesResponseAction
 | GetTeammatesErrorAction
 | UpdateListAction
 | UpdateDateAction
 | UpdateSearchString
 | UpdateSearchQueryOptions
 | SetTeammateLocationAction
 | SetMoreTeammateLoadingAction
 | SetTeammatesDropdownAction;

type ITeammateState = {
  list: TeammateList;
  locations: string[];
  getFilteredTeammates: (teammates: Teammate[]) => Teammate[];
  teammates: Teammate[];
  teammatesError?: string;
  date: Date;
  searchString?: string;
  searchQueryOptions?: QueryOption[];
  teammatesLoading: boolean;
  moreTeammatesLoading: boolean;
  teammatesDropdown: TeammateList[];
};

type ITeammateFilterModel = {
  state: ITeammateState;
  updateLocations: (locations: string[]) => void;
  updateList: (list: TeammateList, force?: boolean) => void;
  updateDate: (date: Date) => void;
  getTeammates: (list: TeammateList, searchString?: string) => void;
  updateSearchString: (list: TeammateList, searchString?: string) => void;
  updateSearchQueryOptions:(searchQueryOptions?: QueryOption[]) => void;
  searchMoreTeammates:(
    searchString?: string,
    searchQueryOptions?: QueryOption[],
    presetTeammates?: Teammate[],
    ) => void;
  setTeammateLocation: (id: string, location: string) => void;
  setMoreTeammatesLoading: (buttonLoading: boolean) => void;
  setTeammatesDropdown: (listOptions: TeammateList[]) => void;
};

const getFilterMethod = (state: ITeammateState) => {
  let locationFilter = (teammates: Teammate[]) => teammates;
  if (state.locations.length) {
    locationFilter = (teammates: Teammate[]) => teammates
      .filter((t) => t.location && state.locations?.includes(t.location));
  }
  let searchStringFilter = (teammates: Teammate[]) => teammates;
  if (state.searchString && state.list !== TeammateList.All) {
    searchStringFilter = (teammates: Teammate[]) => teammates
      .filter((t) => {
        if (!t.user.displayName) {
          return false;
        }
        const searchString = state.searchString?.toLowerCase() || "";
        return t.user.displayName.toLowerCase().indexOf(searchString) > -1;
      });
  }
  return (teammates: Teammate[]) => searchStringFilter(locationFilter(teammates));
};

const Context = createContext({} as ITeammateFilterModel);

const reducer = (state: ITeammateState, action: ITeammateAction): ITeammateState => {
  switch (action.type) {
    case UPDATE_LOCATION: {
      const newState = { ...state, locations: action.payload };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }
    case TEAMMATES_REQUEST: {
      const newState = { ...state, teammatesLoading: true };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }
    case TEAMMATES_RESPONSE: {
      const newState = { ...state, teammatesLoading: false, teammates: action.payload };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }
    case TEAMMATES_ERROR: {
      const newState = {
        ...state, teammatesLoading: false, teammates: [], teammatesError: "Something went wrong",
      };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }
    case UPDATE_LIST: {
      const newState = { ...state, list: action.payload };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }
    case UPDATE_DATE: {
      const newState = { ...state, date: action.payload };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }
    case UPDATE_SEARCH_STRING: {
      const newState = {
        ...state,
        searchString: action.payload,
        teammates: [],
        searchQueryOptions: [],
      };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }
    case UPDATE_SEARCH_QUERY_OPTIONS: {
      const newState = { ...state, searchQueryOptions: action.payload };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }
    case SET_MORE_TEAMMATES_LOADING: {
      const newState = {
        ...state,
        moreTeammatesLoading: action.payload,
      };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }
    case SET_TEAMMATE_LOCATION: {
      const newState = {
        ...state,
        teammates: state.teammates.map((t) => {
          const newTeammate = { ...t };
          if (t.user.id === action.payload.id) {
            newTeammate.location = action.payload.location;
          }
          return newTeammate;
        }),
      };
      if (newState.teammates.length && newState.teammates.every((t) => t.location)) {
        const convergeTeammates = newState.teammates.filter((teammate) => teammate.location !== "Unknown");
        logEvent(USER_INTERACTION, [
          { name: VIRALITY_MEASURE, value: ViralityMeasures.ConvergeUserOverlapPercentage },
          { name: DESCRIPTION, value: `${state.list}_converge_overlap` },
          {
            name: OVERLAP_PERCENTAGE,
            value: ((convergeTeammates.length / newState.teammates.length) * 100).toString(),
          },
        ]);
      }

      return newState;
    }

    case SET_TEAMMATES_DROPDOWN: {
      const newState = {
        ...state,
        teammatesDropdown: action.payload,
      };
      return {
        ...newState,
        getFilteredTeammates: getFilterMethod(newState),
      };
    }

    default:
      return state;
  }
};

const TeammateFilterProvider: React.FC = ({ children }) => {
  const { meService, userService } = useApiProvider();
  const { convergeSettings } = useConvergeSettingsContextProvider();

  const getInitialTeammatesListSettings = (): TeammateListSettings => {
    if (convergeSettings !== undefined) {
      const userMyList = convergeSettings?.myList ?? [];
      if (userMyList.length === 0) {
        return {
          optionSelected: TeammateList.Suggested,
          optionsOrdered: teammateFilterSuggestedFirst,
        };
      }
    }
    return {
      optionSelected: TeammateList.MyList,
      optionsOrdered: teammateFilterListFirst,
    };
  };

  const teammateListPerSessionSetup = getInitialTeammatesListSettings();

  const initialState: ITeammateState = {
    teammates: [],
    locations: [],
    teammatesLoading: false,
    list: teammateListPerSessionSetup.optionSelected,
    date: new Date(),
    getFilteredTeammates: (teammates: Teammate[]) => teammates,
    searchQueryOptions: [],
    moreTeammatesLoading: false,
    teammatesDropdown: teammateListPerSessionSetup.optionsOrdered,
  };

  const [state, dispatch] = useReducer(
    reducer,
    initialState,
  );

  const updateLocations = (location: string[]) => {
    dispatch({ type: UPDATE_LOCATION, payload: location });
    dispatch({ type: UPDATE_LIST, payload: TeammateList.Suggested });
  };

  const getTeammates = (list: TeammateList, searchString?: string) => {
    dispatch({ type: TEAMMATES_REQUEST });
    let requestMethod;
    switch (list) {
      case TeammateList.Suggested:
        requestMethod = meService.getPeople;
        break;
      case TeammateList.MyList:
        requestMethod = meService.getMyList;
        break;
      case TeammateList.MyOrganization:
        requestMethod = meService.getWorkgroup;
        break;
      default:
        throw new Error("Invalid list type requested.");
    }
    if (requestMethod) {
      requestMethod().then((teammates) => {
        if (searchString !== undefined && searchString.length > 0) {
          const payload = teammates.filter((x) => {
            if (x.displayName) {
              return x.displayName.toLowerCase().indexOf(
                searchString.toLowerCase(),
              ) > -1;
            }
            return false;
          }).map((teammate) => ({
            user: teammate,
          }));
          dispatch({ type: TEAMMATES_RESPONSE, payload });
        } else {
          const payload = teammates.map((teammate) => ({
            user: teammate,
          }));
          dispatch({ type: TEAMMATES_RESPONSE, payload });
        }
      })
        .catch(() => dispatch({ type: TEAMMATES_ERROR }));
    } else {
      userService.searchUsers(searchString)
        .then((response) => {
          const payload = response.users.map((teammate) => ({
            user: teammate,
          }));
          dispatch({ type: TEAMMATES_RESPONSE, payload });
        })
        .catch(() => dispatch({ type: TEAMMATES_ERROR }));
    }
  };

  const setMoreTeammatesLoading = (buttonLoading: boolean) => {
    dispatch({ type: SET_MORE_TEAMMATES_LOADING, payload: buttonLoading });
  };

  const searchMoreTeammates = (
    searchString?: string,
    qOptions?: QueryOption[],
    teammatesPreset?: Teammate[],
  ) => {
    if (searchString?.length) {
      setMoreTeammatesLoading(true);
      userService.searchUsers(searchString, qOptions)
        .then((data) => {
          const payload = data.users.map((teammate) => ({
            user: teammate,
          }));
          if (!teammatesPreset) {
            dispatch({ type: TEAMMATES_RESPONSE, payload });
          } else {
            dispatch({ type: TEAMMATES_RESPONSE, payload: teammatesPreset.concat(payload) });
          }
          dispatch({ type: UPDATE_SEARCH_QUERY_OPTIONS, payload: data.queryOptions });
          setMoreTeammatesLoading(false);
        })
        .catch(() => {
          dispatch({ type: TEAMMATES_ERROR });
          setMoreTeammatesLoading(false);
        });
    } else {
      dispatch({ type: TEAMMATES_RESPONSE, payload: [] });
    }
  };

  const updateSearchString = (list: TeammateList, searchString?: string) => {
    dispatch({ type: UPDATE_SEARCH_STRING, payload: searchString });
    if (list === TeammateList.All) {
      const qOptions: QueryOption[] | undefined = undefined;
      const resetTeam: Teammate[] | undefined = undefined;
      searchMoreTeammates(searchString, qOptions, resetTeam);
    } else {
      getTeammates(list, searchString);
    }
  };

  const updateList = (list: TeammateList) => {
    dispatch({ type: UPDATE_LIST, payload: list });
    updateSearchString(list, state.searchString);
  };

  const updateDate = (date: Date) => {
    dispatch({ type: UPDATE_DATE, payload: date });
  };

  const updateSearchQueryOptions = (queryOptions?: QueryOption[]) => {
    dispatch({ type: UPDATE_SEARCH_QUERY_OPTIONS, payload: queryOptions });
  };

  const setTeammateLocation = (id: string, location: string) => {
    dispatch({ type: SET_TEAMMATE_LOCATION, payload: { id, location } });
  };

  const setTeammatesDropdown = (listOptions: TeammateList[]) => {
    dispatch({ type: SET_TEAMMATES_DROPDOWN, payload: listOptions });
  };

  return (
    <Context.Provider value={{
      state,
      updateLocations,
      getTeammates,
      updateList,
      updateDate,
      updateSearchString,
      updateSearchQueryOptions,
      searchMoreTeammates,
      setTeammateLocation,
      setMoreTeammatesLoading,
      setTeammatesDropdown,
    }}
    >
      {children}
    </Context.Provider>
  );
};

const useTeammateProvider = (): ITeammateFilterModel => useContext(Context);

export { TeammateFilterProvider, useTeammateProvider };
