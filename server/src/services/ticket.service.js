import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export async function issueTicket({ event_id, order_id, order_item_id, ticket_type_id, attendee_id, short_code = null }) {
  const { rows } = await pool.query(queries.issueTicket, [
    event_id, order_id, order_item_id, ticket_type_id, attendee_id, short_code,
  ]);
  return rows[0] || null;
}

export async function getTicketById(id) {
  const { rows } = await pool.query(queries.getTicketById, [id]);
  return rows[0] || null;
}

export async function getTicketWithDetails(id) {
  const { rows } = await pool.query(queries.getTicketWithDetails, [id]);
  return rows[0] || null;
}

export async function findTicketByQr(qr_token) {
  const { rows } = await pool.query(queries.findTicketByQr, [qr_token]);
  return rows[0] || null;
}

export async function findTicketByShortCode(short_code) {
  const { rows } = await pool.query(queries.findTicketByShortCode, [short_code]);
  return rows[0] || null;
}

export async function listTicketsForOrder(order_id) {
  const { rows } = await pool.query(queries.listTicketsForOrder, [order_id]);
  return rows;
}

export async function listTicketsForUser(user_id) {
  const { rows } = await pool.query(queries.listTicketsForUser, [user_id]);
  return rows;
}

export async function listTicketsForEvent(event_id) {
  const { rows } = await pool.query(queries.listTicketsForEvent, [event_id]);
  return rows;
}

export async function listTicketsForAttendee(attendee_id) {
  const { rows } = await pool.query(queries.listTicketsForAttendee, [attendee_id]);
  return rows;
}

export async function listTicketsForTicketType(ticket_type_id) {
  const { rows } = await pool.query(queries.listTicketsForTicketType, [ticket_type_id]);
  return rows;
}

export async function updateTicketStatus(id, status) {
  const { rows } = await pool.query(queries.updateTicketStatus, [id, status]);
  return rows[0] || null;
}

export async function cancelTicket(id) {
  const { rows } = await pool.query(queries.cancelTicket, [id]);
  return rows[0] || null;
}

// Lock to avoid double check-in race
export async function lockForScan(qr_token) {
  const { rows } = await pool.query(queries.getTicketForScanLock, [qr_token]);
  return rows[0] || null;
}
