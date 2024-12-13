// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import { Loader } from "@fluentui/react-northstar";
import { useGetUserPrediciton } from "../../../hooks/usePrediction";
import { Teammate } from "../../../providers/TeammateFilterProvider";

interface Props {
  teammate: Teammate;
}

const UserLocationCell: React.FC<Props> = (props) => {
  const { teammate } = props;
  const today = new Date();
  const { data: location, isFetching: loading, isError } = useGetUserPrediciton(teammate?.user.userPrincipalName ?? "", today);

  return (loading ? (<Loader />)
    : (<span>{isError ? "Unknown" : location?.name}</span>)
  );
};

export default UserLocationCell;
