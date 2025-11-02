import { Router } from "express";
import * as c from "../controllers/orders.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.post("/", requireAuth, c.create);
r.get("/:id", requireAuth, c.get);
r.patch("/:id/status", requireAuth, c.setStatus);
r.patch("/:id/totals", requireAuth, c.updateTotals);
r.post("/:id/cancel", requireAuth, c.cancel);

r.get("/me/list", requireAuth, c.listForUser);
r.get("/event/:eventId", requireAuth, c.listForEvent);

r.post("/:id/items/check", requireAuth, c.checkAvailabilityForAdd);
r.post("/:id/items", requireAuth, c.addItem);
r.patch("/:id/items/:itemId", requireAuth, c.updateItem);
r.delete("/:id/items/:itemId", requireAuth, c.deleteItem);

export default r;
