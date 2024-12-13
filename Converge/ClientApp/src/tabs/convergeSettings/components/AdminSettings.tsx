import React from "react";
import ManageAppBanner from "./ManageAppBanner";
import WorkspaceVenueType from "./WorkspaceVenueType";

const AdminSettings: React.FC = () => (
  <>
    <h4>App banner message</h4>
    <ManageAppBanner />
    <h4>Manage venue types</h4>
    <WorkspaceVenueType />
  </>
);

export default AdminSettings;
