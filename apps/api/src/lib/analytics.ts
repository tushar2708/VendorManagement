import Mixpanel from "mixpanel";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

// Only initialise when analytics is explicitly enabled AND a token exists.
// This keeps local/dev event traffic out of the shared Mixpanel project.
const mp =
  env.ANALYTICS_ENABLED && env.MIXPANEL_TOKEN
    ? Mixpanel.init(env.MIXPANEL_TOKEN, { host: "api-eu.mixpanel.com" })
    : null;

/**
 * Track a server-side event. `distinct_id` must be the user's database id so
 * the event stitches to the same profile the browser SDK identifies.
 *
 * To feed group analytics, include the org id as a property on the event
 * (`buyer_org` for buyer-side events, `vendor_org` for vendor-side events).
 */
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

/** Set profile properties only if they are not already set (first-touch facts). */
export function setUserProfileOnce(
  userId: string,
  properties: Record<string, unknown>,
): void {
  if (!mp) return;
  try {
    mp.people.set_once(userId, properties);
  } catch (err) {
    logger.error({ err, userId }, "mixpanel people.set_once failed");
  }
}

/**
 * Set properties on a group profile (e.g. the buyer org). Group analytics also
 * requires each event to carry the group id as a property — see `trackServer`.
 */
export function setGroupProfile(
  groupKey: string,
  groupId: string,
  properties: Record<string, unknown>,
): void {
  if (!mp) return;
  try {
    mp.groups.set(groupKey, groupId, properties);
  } catch (err) {
    logger.error({ err, groupKey, groupId }, "mixpanel groups.set failed");
  }
}
