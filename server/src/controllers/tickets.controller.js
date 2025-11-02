import * as tickets from "../services/ticket.service.js";
import { makeTicketQrDataURL } from "../utils/qr.js";

export async function getById(req, res) {
  try {
    const t = await tickets.getTicketWithDetails(req.params.id);
    if (!t) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ ticket: t });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function listForOrder(req, res) {
  try {
    const rows = await tickets.listTicketsForOrder(req.params.orderId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listForUser(req, res) {
  try {
    const rows = await tickets.listTicketsForUser(req.user.id);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

export async function listForEvent(req, res) {
  try {
    const rows = await tickets.listTicketsForEvent(req.params.eventId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function cancel(req, res) {
  try {
    const row = await tickets.cancelTicket(req.params.id);
    return res.json({ ticket: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function qrDataURL(req, res) {
  try {
    const t = await tickets.getTicketById(req.params.id);
    if (!t) return res.status(404).json({ error: { message: "Not found" } });
    const dataUrl = await makeTicketQrDataURL(t);
    return res.json({ dataUrl });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}
