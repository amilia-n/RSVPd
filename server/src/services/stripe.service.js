import Stripe from 'stripe';
import { config } from '../config/env.js';
import pool from '../db/pool.js';
import { queries } from '../db/queries.js';
import * as orderService from './order.service.js';
import * as userService from './user.service.js';

// Initialize Stripe SDK with secret key
const stripe = new Stripe(config.STRIPE_SECRET, {
  apiVersion: '2024-12-18.acacia', 
});

/**
 * Get or create Stripe customer for a user
 * @param {string} userId - Internal user ID
 * @returns {Promise<string>} - Stripe customer ID
 */

export async function getOrCreateStripeCustomer(userId) {
  const user = await userService.getById(userId);
  if (!user) throw new Error('User not found');

  // If user already has Stripe customer ID, return it
  if (user.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.first_name} ${user.last_name}`,
    metadata: {
      user_id: userId,
    },
  });

  // Store Stripe customer ID in database
  await userService.updateUser(userId, {
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    magicbell_external_id: user.magicbell_external_id,
    stripe_customer_id: customer.id,
  });

  return customer.id;
}

/**
 * Create Stripe Checkout Session for an order
 * @param {string} orderId - Internal order ID
 * @returns {Promise<{id: string, url: string}>} - Session ID and checkout URL
 */
export async function createCheckoutSession(orderId) {
  // Fetch order with items
  const order = await orderService.getOrderWithItems(orderId);
  if (!order) throw new Error('Order not found');

  // Verify order status is DRAFT or PENDING
  if (!['DRAFT', 'PENDING'].includes(order.status)) {
    throw new Error(`Cannot create checkout for order with status: ${order.status}`);
  }

  // Get or create Stripe customer
  if (!order.purchaser_user_id) {
    throw new Error('Order must have a purchaser_user_id');
  }
  const customerId = await getOrCreateStripeCustomer(order.purchaser_user_id);

  // Build line items from order items
  const lineItems = order.items.map(item => ({
    quantity: item.quantity,
    price_data: {
      currency: order.currency.toLowerCase(),
      unit_amount: item.unit_price_cents,
      product_data: {
        name: item.ticket_type_name || `Ticket Type ${item.ticket_type_id}`,
        description: item.ticket_type_kind || 'Event Ticket',
      },
    },
  }));

  // Create payment record (PENDING status) to track the checkout attempt
  const { rows: paymentRows } = await pool.query(queries.insertPayment, [
    order.id,              // order_id ($1)
    null,                  // provider_payment_id ($2)
    'PENDING',             // status ($3)
    order.total_cents,     // amount_cents ($4)
    order.currency,        // currency ($5)
    // Note: 'CARD' method is hardcoded in the query
    null,                  // provider_session_id ($6)
    'payment',             // checkout_mode ($7)
    'open',                // checkout_status ($8)
    null,                  // payment_intent_id ($9)
    null,                  // latest_charge_id ($10)
    null,                  // receipt_url ($11)
    null,                  // received_at ($12)
  ]);
  const payment = paymentRows[0];

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: lineItems,
    success_url: `${config.CHECKOUT_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.CHECKOUT_CANCEL_URL}?order_id=${orderId}`,
    metadata: {
      order_id: orderId,
      payment_id: payment.id,
      user_id: order.purchaser_user_id,
    },
    // Enable automatic tax if needed
    // automatic_tax: { enabled: true },
  });

  // Update payment record with session ID
  const { rows: updatedPayment } = await pool.query(
    `UPDATE payments 
     SET provider_session_id = $1, checkout_status = 'open', updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [session.id, payment.id]
  );

  // Update order status to PENDING (if it was DRAFT)
  if (order.status === 'DRAFT') {
    await orderService.setOrderStatus(orderId, 'PENDING');
  }

  return {
    id: session.id,
    url: session.url,
    payment_id: payment.id,
  };
}

/**
 * Handle Stripe webhook event
 * @param {Buffer} rawBody - Raw request body (for signature verification)
 * @param {string} signature - Stripe signature header
 * @returns {Promise<void>}
 */
export async function handleWebhook(rawBody, signature) {
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  // Log webhook event to database
  await pool.query(queries.insertWebhookEvent, [
    'STRIPE',
    event.type,
    event.id,
    true, // signature_ok
    JSON.stringify(event),
  ]);

  // Handle different event types
  if (event.type === 'checkout.session.completed') {
    await handleCheckoutSessionCompleted(event.data.object);
  } else if (event.type === 'payment_intent.succeeded') {
    await handlePaymentIntentSucceeded(event.data.object);
  } else if (event.type === 'checkout.session.async_payment_succeeded') {
    await handleCheckoutSessionCompleted(event.data.object);
  } else if (event.type === 'payment_intent.payment_failed') {
    await handlePaymentIntentFailed(event.data.object);
  }

  // Mark webhook as handled
  const { rows } = await pool.query(queries.findWebhookByProviderId, ['STRIPE', event.id]);
  if (rows[0]) {
    await pool.query(queries.markWebhookHandled, [rows[0].id]);
  }
}

async function handleCheckoutSessionCompleted(session) {
  const orderId = session.metadata?.order_id;
  const paymentId = session.metadata?.payment_id;

  if (!orderId || !paymentId) {
    console.error('Missing order_id or payment_id in session metadata');
    return;
  }

  // Fetch payment intent to get charge details
  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

  // Update payment record
  await pool.query(queries.updatePaymentOnSessionComplete, [
    session.id,                    // provider_session_id
    'SUCCEEDED',                   // status
    session.payment_intent,        // payment_intent_id
    paymentIntent.latest_charge?.id || null, // latest_charge_id
    session.metadata?.receipt_url || paymentIntent.charges?.data[0]?.receipt_url || null, // receipt_url
  ]);
  await orderService.setOrderStatus(orderId, 'PAID');
    try {
    const ticketService = await import('./ticket.service.js');
    const tickets = await ticketService.issueTicketsForOrder(orderId);
    console.log(`Issued ${tickets.length} ticket(s) for order ${orderId}`);
  } catch (err) {
    console.error(`Failed to issue tickets for order ${orderId}:`, err);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  const { rows } = await pool.query(queries.findPaymentByIntentId, [paymentIntent.id]);
  if (rows[0]) {
    await pool.query(queries.updatePaymentOnSessionComplete, [
      rows[0].provider_session_id,
      'SUCCEEDED',
      paymentIntent.id,
      paymentIntent.latest_charge?.id || null,
      paymentIntent.charges?.data[0]?.receipt_url || null,
    ]);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  const { rows } = await pool.query(queries.findPaymentByIntentId, [paymentIntent.id]);
  if (rows[0]) {
    await pool.query(queries.updatePaymentStatus, [rows[0].id, 'FAILED']);
  }
}