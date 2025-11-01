import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export const markTicketCheckedIn = async (ticket_id, event_id, scanned_by_user_id, device_label) =>
  (await pool.query(queries.markTicketCheckedIn, [ticket_id, event_id, scanned_by_user_id ?? null, device_label ?? null])).rows[0];

export const getCheckInByTicketId = async (ticket_id) => (await pool.query(queries.getCheckInByTicketId, [ticket_id])).rows[0] || null;

export const listCheckInsForEvent = async (eventId) => (await pool.query(queries.listCheckInsForEvent, [eventId])).rows;

export const listCheckInsByUser = async (userId) => (await pool.query(queries.listCheckInsByUser, [userId])).rows;

export const getCheckInStatsForEvent = async (eventId) => (await pool.query(queries.getCheckInStatsForEvent, [eventId])).rows[0] || null;
