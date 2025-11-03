#!/usr/bin/env node

/**
 * Manually Issue Tickets for an Order
 *
 * Usage:
 *   NODE_ENV=production DATABASE_URL=<url> node scripts/issue-tickets-for-order.js <order-id>
 */

import pool from '../src/db/pool.js';

const orderId = process.argv[2];

if (!orderId) {
  console.error('Usage: node scripts/issue-tickets-for-order.js <order-id>');
  process.exit(1);
}

console.log(`Manually issuing tickets for order: ${orderId}\n`);

async function run() {
  try {
    // Import ticket service
    const ticketService = await import('../src/services/ticket.service.js');
    const orderService = await import('../src/services/order.service.js');

    // Get order info
    const order = await orderService.getOrderWithItems(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    console.log(`Order Status: ${order.status}`);
    console.log(`Order Total: $${(order.total_cents / 100).toFixed(2)}`);
    console.log(`Items: ${order.items?.length || 0}\n`);

    // Check if order is PAID
    if (order.status !== 'PAID') {
      console.log(`⚠️  Order status is ${order.status}, not PAID`);
      console.log('Updating order status to PAID...\n');
      await orderService.setOrderStatus(orderId, 'PAID');
    }

    // Issue tickets
    console.log('Issuing tickets...\n');
    const tickets = await ticketService.issueTicketsForOrder(orderId);

    console.log(`\n✅ Successfully issued ${tickets.length} ticket(s):`);
    tickets.forEach((ticket, i) => {
      console.log(`  ${i + 1}. Ticket ${ticket.short_code} - Type: ${ticket.ticket_type_id}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
