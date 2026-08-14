import { useState } from "react";
import { useAuth } from "../../hooks/use-auth.js";
import { getDefaultView } from "../../lib/permissions.js";
import { VendorExecutiveDashboard } from "./executive-dashboard.js";
import { VendorLeadershipDashboard } from "./leadership-dashboard.js";
import { track } from "../../lib/analytics.js";

export function VendorDashboard(): React.ReactElement {
  const { user } = useAuth();
  const defaultView = getDefaultView(user?.role ?? "VENDOR", user?.tier ?? "EXECUTIVE");
  const [view, setView] = useState<"executive" | "leadership">(defaultView);

  const switchView = (to: "executive" | "leadership") => {
    track("view_switched", {
      from_view: view,
      to_view: to,
      role: user?.role ?? "VENDOR",
      tier: user?.tier ?? "EXECUTIVE",
    });
    setView(to);
  };

  if (view === "leadership") {
    return <VendorLeadershipDashboard onSwitchToExecutive={() => switchView("executive")} />;
  }
  return <VendorExecutiveDashboard onSwitchToLeadership={() => switchView("leadership")} />;
}

export default VendorDashboard;
