import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export const insertAttendee = async (payload) =>
  (await pool.query(queries.insertAttendee, [payload.user_id ?? null, payload.full_name, payload.email, payload.phone ?? null])).rows[0];

export const findOrCreateAttendee = async (user_id, full_name, email, phone) =>
  (await pool.query(queries.findOrCreateAttendee, [user_id ?? null, full_name, email, phone ?? null])).rows[0];

export const updateAttendee = async (id, patch) =>
  (await pool.query(queries.updateAttendee, [id, patch.full_name, patch.email, patch.phone ?? null])).rows[0];

export const getAttendeeById = async (id) => (await pool.query(queries.getAttendeeById, [id])).rows[0] || null;
export const getAttendeeByEmail = async (email) => (await pool.query(queries.getAttendeeByEmail, [email])).rows[0] || null;

export const listAttendeesForUser = async (userId) => (await pool.query(queries.listAttendeesForUser, [userId])).rows;
export const listAttendeesForEvent = async (eventId) => (await pool.query(queries.listAttendeesForEvent, [eventId])).rows;

export const issueTicket = async (payload) =>
  (await pool.query(queries.issueTicket, [
    payload.event_id, payload.order_id, payload.order_item_id, payload.ticket_type_id, payload.attendee_id, payload.short_code ?? null,
  ])).rows[0];

export const getTicketById = async (id) => (await pool.query(queries.getTicketById, [id])).rows[0] || null;
export const getTicketWithDetails = async (id) => (await pool.query(queries.getTicketWithDetails, [id])).rows[0] || null;

export const findTicketByQr = async (qr_token) => (await pool.query(queries.findTicketByQr, [qr_token])).rows[0] || null;
export const findTicketByShortCode = async (code) => (await pool.query(queries.findTicketByShortCode, [code])).rows[0] || null;

export const listTicketsForOrder = async (orderId) => (await pool.query(queries.listTicketsForOrder, [orderId])).rows;
export const listTicketsForUser = async (userId) => (await pool.query(queries.listTicketsForUser, [userId])).rows;
export const listTicketsForEvent = async (eventId) => (await pool.query(queries.listTicketsForEvent, [eventId])).rows;
export const listTicketsForAttendee = async (attendeeId) => (await pool.query(queries.listTicketsForAttendee, [attendeeId])).rows;
export const listTicketsForTicketType = async (ticketTypeId) => (await pool.query(queries.listTicketsForTicketType, [ticketTypeId])).rows;

export const updateTicketStatus = async (id, status) =>
  (await pool.query(queries.updateTicketStatus, [id, status])).rows[0];

export const cancelTicket = async (id) => (await pool.query(queries.cancelTicket, [id])).rows[0];

export const getTicketForScanLock = async (qr_token) =>
  (await pool.query(queries.getTicketForScanLock, [qr_token])).rows[0] || null;
