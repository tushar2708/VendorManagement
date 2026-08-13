import mixpanel from "mixpanel-browser";

const token = import.meta.env.VITE_MIXPANEL_TOKEN ?? "";
let initialized = false;

export function initAnalytics(): void {
  if (initialized || !token) return;
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
}): void {
  if (!initialized) return;
  mixpanel.identify(user.id);
  mixpanel.people.set({
    $email: user.email,
    $name: user.name ?? undefined,
    role: user.role,
    tier: user.tier,
  });
}

export function resetAnalytics(): void {
  if (!initialized) return;
  mixpanel.reset();
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  mixpanel.track(event, properties);
}

export function trackPageView(path: string): void {
  if (!initialized) return;
  mixpanel.track("page_viewed", { path });
}
