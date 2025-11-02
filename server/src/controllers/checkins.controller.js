import * as checkins from "../services/checkin.service.js";
import * as tickets from "../services/ticket.service.js";
import { verifyQrPayload } from "../utils/qr.js";

export async function scan(req, res) {
  try {
    const { qr_text, qr_payload, qr_token: legacyToken, device_label, event_id: eventIdFromClient } = req.body ?? {};

    let token = legacyToken;
    let eventId = eventIdFromClient;

    if (!token && (qr_text || qr_payload)) {
      const obj = typeof qr_payload === "object" ? qr_payload : JSON.parse(qr_text);
      if (!verifyQrPayload(obj)) {
        return res.status(400).json({ error: { message: "Invalid QR signature" } });
      }
      token = obj.t;
      eventId = obj.e;
      if (obj.exp && Date.now() / 1000 > obj.exp) {
        return res.status(400).json({ error: { message: "QR code expired" } });
      }
    }

    if (!token) return res.status(400).json({ error: { message: "qr_token or qr_text required" } });

    // Lock ticket to prevent double check-in
    const row = await tickets.lockForScan(token);
    if (!row) return res.status(404).json({ error: { message: "Ticket not found or locked" } });

    if (row.status !== "ACTIVE") {
      return res.status(400).json({ error: { message: `Ticket status: ${row.status}` } });
    }

    if (eventId && eventId !== row.event_id) {
      return res.status(400).json({ error: { message: "Ticket does not belong to this event" } });
    }

    const already = await checkins.getByTicket(row.id);
    if (already) return res.status(409).json({ error: { message: "Already checked in" } });

    const ci = await checkins.markCheckedIn({
      ticket_id: row.id,
      event_id: row.event_id,
      scanned_by_user_id: req.user?.id ?? null,
      device_label: device_label ?? null,
    });

    return res.status(201).json({ check_in: ci });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function listForEvent(req, res) {
  try {
    const rows = await checkins.listForEvent(req.params.eventId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listByUser(req, res) {
  try {
    const rows = await checkins.listByUser(req.user.id);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

export async function stats(req, res) {
  try {
    const row = await checkins.getStatsForEvent(req.params.eventId);
    return res.json({ stats: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}
