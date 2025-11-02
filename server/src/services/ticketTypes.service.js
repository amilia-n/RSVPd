import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export async function createTicketType(payload) {
  const {
    event_id, name, description_md = null, kind,
    price_cents, currency = "USD", quantity_total = null,
    per_user_limit = null, per_order_limit = 1,
    sales_start_at = null, sales_end_at = null, is_active = true,
  } = payload;

  const { rows } = await pool.query(queries.createTicketType, [
    event_id, name, description_md, kind, price_cents, currency, quantity_total,
    per_user_limit, per_order_limit, sales_start_at, sales_end_at, is_active,
  ]);
  return rows[0] || null;
}

export async function updateTicketType(id, patch) {
  const {
    name, description_md = null, kind,
    price_cents, currency = "USD", quantity_total = null,
    per_user_limit = null, per_order_limit = 1,
    sales_start_at = null, sales_end_at = null, is_active = true,
  } = patch;
  const { rows } = await pool.query(queries.updateTicketType, [
    id, name, description_md, kind, price_cents, currency, quantity_total,
    per_user_limit, per_order_limit, sales_start_at, sales_end_at, is_active,
  ]);
  return rows[0] || null;
}

export async function getTicketTypeById(id) {
  const { rows } = await pool.query(queries.getTicketTypeById, [id]);
  return rows[0] || null;
}

export async function listTicketTypesForEvent(event_id, all = false) {
  const q = all ? queries.listAllTicketTypesForEvent : queries.listTicketTypesForEvent;
  const { rows } = await pool.query(q, [event_id]);
  return rows;
}

export async function deactivateTicketType(id) {
  const { rows } = await pool.query(queries.deactivateTicketType, [id]);
  return rows[0] || null;
}

export async function availabilityForType(ticket_type_id) {
  const { rows } = await pool.query(queries.netAvailableForType, [ticket_type_id]);
  return rows[0]?.available ?? 0;
}

export async function lockTicketType(ticket_type_id) {
  const { rows } = await pool.query(queries.lockTicketType, [ticket_type_id]);
  return rows[0] || null;
}

export async function countSoldForType(ticket_type_id) {
  const { rows } = await pool.query(queries.countSoldForType, [ticket_type_id]);
  return rows[0]?.sold ?? 0;
}

export async function sumReservationsForType(ticket_type_id) {
  const { rows } = await pool.query(queries.sumReservationsForType, [ticket_type_id]);
  return rows[0]?.qty ?? 0;
}

export async function currentOrderQtyForType(order_id, ticket_type_id) {
  const { rows } = await pool.query(queries.currentOrderQtyForType, [order_id, ticket_type_id]);
  return rows[0]?.qty ?? 0;
}
