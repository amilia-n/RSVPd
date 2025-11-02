import * as payments from "../services/payment.service.js";

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
