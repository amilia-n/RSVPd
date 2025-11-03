import pool from "../db/pool.js";
import { queries } from "../db/queries.js";
import * as attendeeService from './attendee.service.js';
import { shortCodeFromId } from '../utils/qr.js';
import * as orderService from './order.service.js';
import * as userService from './user.service.js';


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

export async function issueTicketsForOrder(orderId) {
  const order = await orderService.getOrderWithItems(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'PAID') {
    throw new Error(`Cannot issue tickets for order with status: ${order.status}`);
  }

  const existingTickets = await listTicketsForOrder(orderId);
  if (existingTickets.length > 0) {
    console.log(`Tickets already issued for order ${orderId}. Skipping issuance.`);
    return existingTickets;
  }

  const purchaser = order.purchaser_user_id 
    ? await userService.getById(order.purchaser_user_id)
    : null;

  const purchaserName = purchaser 
    ? `${purchaser.first_name} ${purchaser.last_name}`
    : order.purchaser_email.split('@')[0]; 

    const purchaserAttendee = await attendeeService.findOrCreateAttendee(
    order.purchaser_user_id,
    purchaserName,
    order.purchaser_email,
    purchaser?.phone || null
  );

  if (!purchaserAttendee) {
    throw new Error('Failed to create or find attendee');
  }

  const issuedTickets = [];
  for (const item of order.items) {
    // For each quantity in the order item, issue one ticket
    for (let i = 0; i < item.quantity; i++) {
      const ticketId = `${item.id}-${i}`;
      const shortCode = shortCodeFromId(ticketId);

      const ticket = await issueTicket({
        event_id: order.event_id,
        order_id: orderId,
        order_item_id: item.id,
        ticket_type_id: item.ticket_type_id,
        attendee_id: purchaserAttendee.id,
        short_code: shortCode,
      });

      if (ticket) {
        issuedTickets.push(ticket);
      }
    }
  }
  // Send notification to purchaser
  try {
    const notificationService = await import('./notification.service.js');
    await notificationService.createAndSendNotification({
      target_user_id: order.purchaser_user_id,
      title: 'Tickets Issued',
      body_md: `Your ${issuedTickets.length} ticket(s) for the event have been issued!`,
      event_id: order.event_id,
      channel: 'IN_APP',
    });
  } catch (err) {
    // Log error but don't fail ticket issuance
    console.error(`Failed to send notification for order ${orderId}:`, err);
  }
  return issuedTickets;
}