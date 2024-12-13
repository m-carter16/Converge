import { User } from "@microsoft/microsoft-graph-types";
import UserLocation from "./UserLocation";

interface UserWeeklyLocations {
  user: User;
  weekNumber: number;
  year: number;
  locationsList: UserLocation[];
}

export default UserWeeklyLocations;
