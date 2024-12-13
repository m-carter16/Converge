// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import { Alert } from "@fluentui/react-northstar";
import dayjs from "dayjs";
import Opportunity from "../../../types/Opportunity";

interface Props {
  opportunities: Opportunity[];
  date: Date;
}

const OpportunityAlert: React.FC<Props> = (props) => {
  const { opportunities, date } = props;
  const [visible, setVisible] = React.useState(true);
  const formattedDate = `tomorrow, ${dayjs(date).format("dddd, MMMM D")}`;

  return (
    <div style={{ padding: "0 1.5em" }}>
      <Alert
        content={`You have opportunities to connect with teammates in the ${opportunities[0].location} office ${formattedDate}`}
        onVisibleChange={() => setVisible(false)}
        visible={visible}
        warning
      />
    </div>
  );
};

export default OpportunityAlert;
