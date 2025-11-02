import * as orders from "../services/order.service.js";
import * as tt from "../services/ticketTypes.service.js";

export async function create(req, res) {
  try {
    const row = await orders.createOrder(req.body ?? {});
    return res.status(201).json({ order: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function get(req, res) {
  try {
    const row = await orders.getOrderWithItems(req.params.id);
    if (!row) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ order: row });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function setStatus(req, res) {
  try {
    const { status } = req.body ?? {};
    if (!status) return res.status(400).json({ error: { message: "Missing status" } });
    const row = await orders.setOrderStatus(req.params.id, status);
    return res.json({ order: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function updateTotals(req, res) {
  try {
    const row = await orders.updateOrderTotals(req.params.id, req.body ?? {});
    return res.json({ order: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listForUser(req, res) {
  try {
    const { limit, offset } = req.query ?? {};
    const rows = await orders.listOrdersForUser(req.user.id, Number(limit) || 25, Number(offset) || 0);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

export async function listForEvent(req, res) {
  try {
    const { status, limit, offset } = req.query ?? {};
    const rows = await orders.listOrdersForEvent(
      req.params.eventId,
      status ?? null,
      Number(limit) || 25,
      Number(offset) || 0
    );
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function addItem(req, res) {
  try {
    const item = await orders.addOrderItem(req.body ?? {});
    return res.status(201).json({ item });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function updateItem(req, res) {
  try {
    const item = await orders.updateOrderItem({ id: req.params.itemId, ...req.body });
    return res.json({ item });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function deleteItem(req, res) {
  try {
    const row = await orders.deleteOrderItem(req.params.itemId, req.params.id);
    return res.json({ deleted: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function cancel(req, res) {
  try {
    const row = await orders.cancelOrder(req.params.id);
    return res.json({ order: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function checkAvailabilityForAdd(req, res) {
  try {
    const { order_id, ticket_type_id, quantity } = req.body ?? {};
    if (!order_id || !ticket_type_id || !quantity) {
      return res.status(400).json({ error: { message: "Missing required fields" } });
    }

    await tt.lockTicketType(ticket_type_id);
    const available = await tt.availabilityForType(ticket_type_id);
    if (available < quantity) {
      return res.status(409).json({ error: { message: "Insufficient inventory", available } });
    }
    return res.json({ ok: true, available });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}
