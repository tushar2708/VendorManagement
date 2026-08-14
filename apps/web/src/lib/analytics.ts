import mixpanel from "mixpanel-browser";

const token = import.meta.env.VITE_MIXPANEL_TOKEN ?? "";
// Off unless explicitly enabled, so local/dev runs don't pollute the project.
const enabled = import.meta.env.VITE_ANALYTICS_ENABLED === "true";
let initialized = false;

export function initAnalytics(): void {
  if (initialized || !token || !enabled) return;
  mixpanel.init(token, {
    autocapture: true,
    record_sessions_percent: 100,
    api_host: "https://api-eu.mixpanel.com",
  });
  initialized = true;
}

export function identifyUser(user: {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  tier?: string | null;
  buyerOrgId?: string | null;
  vendorOrgId?: string | null;
}): void {
  if (!initialized) return;
  mixpanel.identify(user.id);
  mixpanel.people.set({
    $email: user.email,
    $name: user.name ?? undefined,
    role: user.role,
    tier: user.tier,
  });
  // Group analytics: attach the org to every subsequent event when we know it.
  if (user.buyerOrgId) mixpanel.set_group("buyer_org", user.buyerOrgId);
  if (user.vendorOrgId) mixpanel.set_group("vendor_org", user.vendorOrgId);
}

export function resetAnalytics(): void {
  if (!initialized) return;
  mixpanel.reset();
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  mixpanel.track(event, properties);
}

/**
 * Start a timer for `event`. When that event is later tracked, Mixpanel
 * auto-attaches `$duration` (seconds since this call). Used to measure how long
 * a form takes from open to submit.
 */
export function timeEvent(event: string): void {
  if (!initialized) return;
  mixpanel.time_event(event);
}

export function trackPageView(path: string): void {
  if (!initialized) return;
  mixpanel.track("page_viewed", { path });
}
