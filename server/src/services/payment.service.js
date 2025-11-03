import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export async function insertPayment(payload) {
  const {
    order_id, provider_payment_id = null, status, amount_cents, currency = "USD",
    provider_session_id = null, checkout_mode = null, checkout_status = null,
    payment_intent_id = null, latest_charge_id = null, receipt_url = null, received_at = null,
  } = payload;

  const { rows } = await pool.query(queries.insertPayment, [
    order_id, provider_payment_id, status, amount_cents, currency,
    provider_session_id, checkout_mode, checkout_status,
    payment_intent_id, latest_charge_id, receipt_url, received_at,
  ]);
  return rows[0] || null;
}

export async function getPaymentById(id) {
  const { rows } = await pool.query(queries.getPaymentById, [id]);
  return rows[0] || null;
}

export async function findPaymentBySession(session_id) {
  const { rows } = await pool.query(queries.findPaymentBySession, [session_id]);
  return rows[0] || null;
}

export async function findPaymentByIntentId(intent_id) {
  const { rows } = await pool.query(queries.findPaymentByIntentId, [intent_id]);
  return rows[0] || null;
}

export async function updatePaymentOnSessionComplete(session_id, status, payment_intent_id, latest_charge_id, receipt_url) {
  const { rows } = await pool.query(queries.updatePaymentOnSessionComplete, [
    session_id, status, payment_intent_id, latest_charge_id, receipt_url,
  ]);
  return rows[0] || null;
}

export async function updatePaymentStatus(id, status) {
  const { rows } = await pool.query(queries.updatePaymentStatus, [id, status]);
  return rows[0] || null;
}

export async function listPaymentsForOrder(order_id) {
  const { rows } = await pool.query(queries.listPaymentsForOrder, [order_id]);
  return rows;
}

export async function createCheckoutSessionForOrder(order_id) {
  const stripeService = await import('./stripe.service.js');
  return await stripeService.createCheckoutSession(order_id);
}