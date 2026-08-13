import Mixpanel from "mixpanel";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const mp = env.MIXPANEL_TOKEN
  ? Mixpanel.init(env.MIXPANEL_TOKEN, { host: "api-eu.mixpanel.com" })
  : null;

export function trackServer(
  event: string,
  properties: Record<string, unknown> & { distinct_id: string },
): void {
  if (!mp) return;
  try {
    mp.track(event, properties);
  } catch (err) {
    logger.error({ err, event }, "mixpanel track failed");
  }
}

export function setUserProfile(
  userId: string,
  properties: Record<string, unknown>,
): void {
  if (!mp) return;
  try {
    mp.people.set(userId, properties);
  } catch (err) {
    logger.error({ err, userId }, "mixpanel people.set failed");
  }
}
