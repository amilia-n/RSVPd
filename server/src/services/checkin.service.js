import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export async function markCheckedIn({ ticket_id, event_id, scanned_by_user_id = null, device_label = null }) {
  const { rows } = await pool.query(queries.markTicketCheckedIn, [
    ticket_id, event_id, scanned_by_user_id, device_label,
  ]);
  return rows[0] || null;
}

export async function getByTicket(ticket_id) {
  const { rows } = await pool.query(queries.getCheckInByTicketId, [ticket_id]);
  return rows[0] || null;
}

export async function listForEvent(event_id) {
  const { rows } = await pool.query(queries.listCheckInsForEvent, [event_id]);
  return rows;
}

export async function listByUser(user_id) {
  const { rows } = await pool.query(queries.listCheckInsByUser, [user_id]);
  return rows;
}

export async function getStatsForEvent(event_id) {
  const { rows } = await pool.query(queries.getCheckInStatsForEvent, [event_id]);
  return rows[0] || null;
}
