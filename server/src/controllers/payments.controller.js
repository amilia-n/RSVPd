import * as payments from "../services/payment.service.js";
import * as orders from "../services/order.service.js";

export async function create(req, res) {
  try {
    const p = await payments.insertPayment(req.body ?? {});
    return res.status(201).json({ payment: p });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function get(req, res) {
  try {
    const p = await payments.getPaymentById(req.params.id);
    if (!p) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ payment: p });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function updateStatus(req, res) {
  try {
    const { status } = req.body ?? {};
    if (!status) return res.status(400).json({ error: { message: "Missing status" } });
    const p = await payments.updatePaymentStatus(req.params.id, status);
    return res.json({ payment: p });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listForOrder(req, res) {
  try {
    const rows = await payments.listPaymentsForOrder(req.params.orderId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function createCheckoutSession(req, res) {
  try {
    const { order_id } = req.body ?? {};
    if (!order_id) {
      return res.status(400).json({ error: { message: "Missing order_id" } });
    }

    // Verify user owns the order or is authorized
    const order = await orders.getOrder(order_id);
    if (!order) {
      return res.status(404).json({ error: { message: "Order not found" } });
    }

    // Ensure user owns this order
    if (order.purchaser_user_id !== req.user.id) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }

    const stripeService = await import('../services/stripe.service.js');
    const session = await stripeService.createCheckoutSession(order_id);

    return res.status(201).json({ 
      session_id: session.id,
      checkout_url: session.url,
      payment_id: session.payment_id,
    });
  } catch (e) {
    console.error('Checkout session creation error:', e);
    if (e.message.includes('not found')) {
      return res.status(404).json({ error: { message: e.message } });
    }
    return res.status(500).json({ error: { message: "Unable to create checkout session" } });
  }
}

export async function webhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: { message: "Missing stripe-signature header" } });
    }

    const stripeService = await import('../services/stripe.service.js');
    await stripeService.handleWebhook(req.body, signature);

    return res.sendStatus(200);
  } catch (e) {
    console.error('Stripe Webhook Error:', e);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
}