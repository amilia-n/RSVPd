import * as notif from "../services/notification.service.js";

export async function enqueue(req, res) {
  try {
    const row = await notif.enqueueNotification(req.body ?? {});
    return res.status(201).json({ notification: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function get(req, res) {
  try {
    const row = await notif.getNotificationById(req.params.id);
    if (!row) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ notification: row });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function markSent(req, res) {
  try {
    const { magicbell_notification_id } = req.body ?? {};
    const row = await notif.markNotificationSent(req.params.id, magicbell_notification_id ?? null);
    return res.json({ notification: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function updateStatus(req, res) {
  try {
    const { status, error_message } = req.body ?? {};
    const row = await notif.updateNotificationStatus(req.params.id, status, error_message ?? null);
    return res.json({ notification: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listForUser(req, res) {
  try {
    const { limit, offset } = req.query ?? {};
    const rows = await notif.listNotificationsForUser(req.user.id, Number(limit) || 25, Number(offset) || 0);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

export async function listForEvent(req, res) {
  try {
    const rows = await notif.listNotificationsForEvent(req.params.eventId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listQueued(req, res) {
  try {
    const { limit } = req.query ?? {};
    const rows = await notif.listQueuedNotifications(Number(limit) || 100);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

// Devices & Prefs
export async function upsertDevice(req, res) {
  try {
    const row = await notif.upsertDevice(req.body ?? {});
    return res.status(201).json({ device: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listDevices(req, res) {
  try {
    const rows = await notif.listDevicesForUser(req.user.id);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

export async function deleteDevice(req, res) {
  try {
    const row = await notif.deleteDevice(req.params.id);
    return res.json({ deleted: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function updateDeviceLastSeen(req, res) {
  try {
    const row = await notif.updateDeviceLastSeen(req.params.id);
    return res.json({ device: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function disableDevice(req, res) {
  try {
    const row = await notif.disableDevice(req.params.id);
    return res.json({ device: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function incrementDeviceFailCount(req, res) {
  try {
    const row = await notif.incrementDeviceFailCount(req.params.id);
    return res.json({ device: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function getUserPrefs(req, res) {
  try {
    const row = await notif.getUserNotificationPrefs(req.user.id);
    return res.json({ prefs: row });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

export async function upsertUserPrefs(req, res) {
  try {
    await notif.upsertUserNotificationPrefs(req.user.id, req.body ?? {});
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}
