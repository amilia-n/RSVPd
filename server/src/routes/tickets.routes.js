import { Router } from "express";
import * as c from "../controllers/tickets.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.get("/:id", requireAuth, c.getById);
r.get("/:id/qr", requireAuth, c.qrDataURL);
r.post("/:id/cancel", requireAuth, c.cancel);

// Lists
r.get("/order/:orderId", requireAuth, c.listForOrder);
r.get("/me/list", requireAuth, c.listForUser);
r.get("/event/:eventId", requireAuth, c.listForEvent);

export default r;
