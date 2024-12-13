import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";

interface OfficeTeammate {
  mate: MicrosoftGraph.User;
  location: string;
}

export default OfficeTeammate;
