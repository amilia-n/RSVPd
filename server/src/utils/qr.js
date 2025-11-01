import Stripe from "stripe";
import { config } from "../config/env.js";
import { query } from "../db/pool.js";

const stripe = new Stripe(config.STRIPE_SECRET, { apiVersion: "2024-11-20.acacia" }); // ok with ^19.2.0

export async function createCheckoutSession({ orderId, successUrl, cancelUrl }) {
  const { rows: orders } = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (!orders[0]) throw new Error("Order not found");
  const order = orders[0];

  const { rows: items } = await query(
    `SELECT oi.*, tt.name AS ticket_name 
     FROM order_items oi 
     JOIN ticket_types tt ON tt.id = oi.ticket_type_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  const line_items = items.map(i => ({
    price_data: {
      currency: "usd",
      product_data: { name: i.ticket_name },
      unit_amount: i.unit_price_cents,
    },
    quantity: i.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.purchaser_email,
    line_items,
    success_url: `${successUrl}?order_id=${orderId}`,
    cancel_url: `${cancelUrl}?order_id=${orderId}`,
    metadata: { order_id: orderId },
    allow_promotion_codes: true,
  });

  const { rows: pay } = await query(
    `INSERT INTO payments (order_id, provider, status, amount_cents, currency, method, provider_session_id, checkout_mode, checkout_status)
     VALUES ($1,'STRIPE','PENDING',$2,'USD','CARD',$3,'payment','open')
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [orderId, order.total_cents, session.id]
  );

  return { session, payment: pay[0] ?? null };
}

export async function handleStripeEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      const orderId = s.metadata?.order_id;
      if (!orderId) break;

      await query(`UPDATE payments SET 
         provider_payment_id = $1,
         checkout_status = 'complete',
         payment_intent_id = $2,
         status = 'SUCCEEDED',
         received_at = now(),
         updated_at = now()
       WHERE provider_session_id = $3`,
      [s.id, s.payment_intent, s.id]);

      await query(`UPDATE orders SET status = 'PAID', updated_at = now() WHERE id = $1`, [orderId]);

      const { rows: items } = await query(
        `SELECT order_id, id as order_item_id, ticket_type_id, quantity FROM order_items WHERE order_id = $1`,
        [orderId]
      );
      for (const it of items) {
        await query(
          `INSERT INTO tickets (event_id, order_id, order_item_id, ticket_type_id, attendee_id, status)
           SELECT e.id, $1, $2, $3, a.id, 'ACTIVE'
           FROM ticket_types tt
           JOIN events e ON e.id = tt.event_id
           JOIN attendees a ON a.email = (SELECT purchaser_email FROM orders WHERE id = $1)
           WHERE tt.id = $3
           LIMIT 1`,
          [orderId, it.order_item_id, it.ticket_type_id]
        );
      }
      break;
    }

    case "checkout.session.expired": {
      const s = event.data.object;
      await query(`UPDATE payments SET checkout_status = 'expired', updated_at = now()
                   WHERE provider_session_id = $1`, [s.id]);
      break;
    }

    default:
      await query(
        `INSERT INTO webhook_events (provider, event_type, provider_event_id, signature_ok, payload)
         VALUES ('STRIPE', $1, $2, true, $3) 
         ON CONFLICT DO NOTHING`,
        [event.type, event.id, event]
      );
  }
}
