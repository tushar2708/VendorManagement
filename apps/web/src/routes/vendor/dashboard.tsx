import { useState } from "react";
import { useAuth } from "../../hooks/use-auth.js";
import { getDefaultView } from "../../lib/permissions.js";
import { VendorExecutiveDashboard } from "./executive-dashboard.js";
import { VendorLeadershipDashboard } from "./leadership-dashboard.js";

export function VendorDashboard(): React.ReactElement {
  const { user } = useAuth();
  const defaultView = getDefaultView(user?.role ?? "VENDOR", user?.tier ?? "EXECUTIVE");
  const [view, setView] = useState<"executive" | "leadership">(defaultView);

  if (view === "leadership") {
    return <VendorLeadershipDashboard onSwitchToExecutive={() => setView("executive")} />;
  }
  return <VendorExecutiveDashboard onSwitchToLeadership={() => setView("leadership")} />;
}

export default VendorDashboard;
