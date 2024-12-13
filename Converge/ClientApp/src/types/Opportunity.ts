import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";

interface Opportunity {
  user: MicrosoftGraph.User;
  userId: string;
  location: string;
  dismissed: boolean;
  setByUser: boolean;
}

export default Opportunity;
