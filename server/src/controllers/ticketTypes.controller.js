import * as tt from "../services/ticketTypes.service.js";

export async function create(req, res) {
  try {
    const row = await tt.createTicketType(req.body ?? {});
    return res.status(201).json({ ticket_type: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function update(req, res) {
  try {
    const row = await tt.updateTicketType(req.params.id, req.body ?? {});
    return res.json({ ticket_type: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function get(req, res) {
  try {
    const row = await tt.getTicketTypeById(req.params.id);
    if (!row) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ ticket_type: row });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function listForEvent(req, res) {
  try {
    const all = req.query.all === "true";
    const rows = await tt.listTicketTypesForEvent(req.params.eventId, all);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function deactivate(req, res) {
  try {
    const row = await tt.deactivateTicketType(req.params.id);
    return res.json({ ticket_type: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function availability(req, res) {
  try {
    const available = await tt.availabilityForType(req.params.id);
    return res.json({ available });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}
