import pool from "../db/pool.js";
import { queries } from "../db/queries.js";
import * as magicbellService from './magicbell.service.js';
import * as userService from './user.service.js';

export async function enqueueNotification(payload) {
  const {
    org_id = null, event_id = null, title, body_md = null, channel,
    target_user_id = null, target_attendee_email = null, published_by = null, scheduled_at = null,
  } = payload;

  const { rows } = await pool.query(queries.enqueueNotification, [
    org_id, event_id, title, body_md, channel, target_user_id, target_attendee_email, published_by, scheduled_at,
  ]);
  return rows[0] || null;
}

export async function getNotificationById(id) {
  const { rows } = await pool.query(queries.getNotificationById, [id]);
  return rows[0] || null;
}

export async function markNotificationSent(id, magicbell_notification_id) {
  const { rows } = await pool.query(queries.markNotificationSent, [id, magicbell_notification_id]);
  return rows[0] || null;
}

export async function updateNotificationStatus(id, status, error_message = null) {
  const { rows } = await pool.query(queries.updateNotificationStatus, [id, status, error_message]);
  return rows[0] || null;
}

export async function listNotificationsForUser(user_id, limit = 25, offset = 0) {
  const { rows } = await pool.query(queries.listNotificationsForUser, [user_id, limit, offset]);
  return rows;
}

export async function listNotificationsForEvent(event_id) {
  const { rows } = await pool.query(queries.listNotificationsForEvent, [event_id]);
  return rows;
}

export async function listQueuedNotifications(limit = 100) {
  const { rows } = await pool.query(queries.listQueuedNotifications, [limit]);
  return rows;
}

// Devices
export async function upsertDevice(payload) {
  const {
    user_id, device_type, push_token, web_p256dh = null, web_auth = null,
    app_version = null, os_version = null, locale = null, last_seen_at = new Date(),
  } = payload;

  const { rows } = await pool.query(queries.upsertDevice, [
    user_id, device_type, push_token, web_p256dh, web_auth,
    app_version, os_version, locale, last_seen_at,
  ]);
  return rows[0] || null;
}

export async function listDevicesForUser(user_id) {
  const { rows } = await pool.query(queries.listDevicesForUser, [user_id]);
  return rows;
}

export async function deleteDevice(id) {
  const { rows } = await pool.query(queries.deleteDevice, [id]);
  return rows[0] || null;
}

export async function updateDeviceLastSeen(id) {
  const { rows } = await pool.query(queries.updateDeviceLastSeen, [id]);
  return rows[0] || null;
}

export async function disableDevice(id) {
  const { rows } = await pool.query(queries.disableDevice, [id]);
  return rows[0] || null;
}

export async function incrementDeviceFailCount(id) {
  const { rows } = await pool.query(queries.incrementDeviceFailCount, [id]);
  return rows[0] || null;
}

// User notification prefs
export async function getUserNotificationPrefs(user_id) {
  const { rows } = await pool.query(queries.getUserNotificationPrefs, [user_id]);
  return rows[0] || null;
}

export async function upsertUserNotificationPrefs(user_id, prefs) {
  const {
    email_enabled = true,
    push_enabled = true,
    sms_enabled = false,
    in_app_enabled = true,
    quiet_hours_json = {},
    locale = null,
  } = prefs;

  await pool.query(queries.upsertUserNotificationPrefs, [
    user_id, email_enabled, push_enabled, sms_enabled, in_app_enabled, quiet_hours_json, locale,
  ]);
  return { ok: true };
}


// Send notification to MagicBell and update database record

export async function sendNotificationToMagicBell(notificationId) {
  // Get notification record
  const notification = await getNotificationById(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.status !== 'QUEUED') {
    throw new Error(`Cannot send notification with status: ${notification.status}`);
  }

  if (!notification.target_user_id) {
    throw new Error('Notification must have a target_user_id');
  }

  // Fetch user info (for external_id)
  const user = await userService.getById(notification.target_user_id);
  if (!user) {
    throw new Error('User not found');
  }

  // Send to MagicBell
  const magicbellResult = await magicbellService.sendNotification(
    notification.target_user_id,  // Use internal user ID as external_id
    notification.title,
    notification.body_md || '',
    notification.event_id || null
  );

  // Update notification record with MagicBell ID and mark as SENT
  const updated = await markNotificationSent(notificationId, magicbellResult.id);

  return updated;
}


export async function createAndSendNotification(payload, published_by = null) {
  const notification = await enqueueNotification({
    ...payload,
    published_by,
  });

  await sendNotificationToMagicBell(notification.id);
  
  return await getNotificationById(notification.id);
}