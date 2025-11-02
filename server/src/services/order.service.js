import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export async function createOrder(payload) {
  const {
    event_id, purchaser_user_id = null, purchaser_email,
    currency = "USD",
    customer_address_line1 = null, customer_address_line2 = null, customer_city = null,
    customer_state_code = null, customer_postal_code = null, customer_country_code = "US",
    payment_due_at = null, expires_at = null,
  } = payload;

  const { rows } = await pool.query(queries.createOrder, [
    event_id, purchaser_user_id, purchaser_email,
    currency,
    customer_address_line1, customer_address_line2, customer_city,
    customer_state_code, customer_postal_code, customer_country_code,
    payment_due_at, expires_at,
  ]);
  return rows[0] || null;
}

export async function getOrder(id) {
  const { rows } = await pool.query(queries.getOrder, [id]);
  return rows[0] || null;
}

export async function getOrderWithEvent(id, event_id) {
  const { rows } = await pool.query(queries.getOrderWithEvent, [id, event_id]);
  return rows[0] || null;
}

export async function getOrderWithItems(id) {
  const { rows } = await pool.query(queries.getOrderWithItems, [id]);
  return rows[0] || null;
}

export async function updateOrderTotals(id, { subtotal_cents, discount_cents, fees_cents, tax_cents, total_cents }) {
  const { rows } = await pool.query(queries.updateOrderTotals, [
    id, subtotal_cents, discount_cents, fees_cents, tax_cents, total_cents,
  ]);
  return rows[0] || null;
}

export async function setOrderStatus(id, status) {
  const { rows } = await pool.query(queries.setOrderStatus, [id, status]);
  return rows[0] || null;
}

export async function listOrdersForUser(user_id, limit = 25, offset = 0) {
  const { rows } = await pool.query(queries.listOrdersForUser, [user_id, limit, offset]);
  return rows;
}

export async function listOrdersForEvent(event_id, status = null, limit = 25, offset = 0) {
  const { rows } = await pool.query(queries.listOrdersForEvent, [event_id, status, limit, offset]);
  return rows;
}

export async function listOrdersForOrg(org_id, status = null, limit = 25, offset = 0) {
  const { rows } = await pool.query(queries.listOrdersForOrg, [org_id, status, limit, offset]);
  return rows;
}

export async function cancelOrder(id) {
  const { rows } = await pool.query(queries.cancelOrder, [id]);
  return rows[0] || null;
}

export async function expireOrders(ids) {
  const { rows } = await pool.query(queries.expireOrders, [ids]);
  return rows;
}

export async function listOrdersToExpire() {
  const { rows } = await pool.query(queries.listOrdersToExpire);
  return rows.map(r => r.id);
}

// Items
export async function addOrderItem({ order_id, event_id, ticket_type_id, quantity, unit_price_cents, total_cents, metadata = {} }) {
  const { rows } = await pool.query(queries.addOrderItem, [
    order_id, event_id, ticket_type_id, quantity, unit_price_cents, total_cents, metadata,
  ]);
  return rows[0] || null;
}

export async function listOrderItems(order_id) {
  const { rows } = await pool.query(queries.listOrderItems, [order_id]);
  return rows;
}

export async function getOrderItemById(id, order_id) {
  const { rows } = await pool.query(queries.getOrderItemById, [id, order_id]);
  return rows[0] || null;
}

export async function updateOrderItem({ id, order_id, quantity, unit_price_cents, total_cents, metadata = {} }) {
  const { rows } = await pool.query(queries.updateOrderItem, [
    id, order_id, quantity, unit_price_cents, total_cents, metadata,
  ]);
  return rows[0] || null;
}

export async function deleteOrderItem(id, order_id) {
  const { rows } = await pool.query(queries.deleteOrderItem, [id, order_id]);
  return rows[0] || null;
}

export async function countUserTicketsForType(ticket_type_id, purchaser_user_id) {
  const { rows } = await pool.query(queries.countUserTicketsForType, [ticket_type_id, purchaser_user_id]);
  return rows[0]?.qty ?? 0;
}

export async function countUserActiveReservationsForType(ticket_type_id, purchaser_user_id) {
  const { rows } = await pool.query(queries.countUserActiveReservationsForType, [ticket_type_id, purchaser_user_id]);
  return rows[0]?.qty ?? 0;
}
