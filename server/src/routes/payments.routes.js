import { Router } from "express";
import * as c from "../controllers/payments.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.post("/checkout-session", requireAuth, c.createCheckoutSession);

r.post("/", requireAuth, c.create);
r.get("/:id", requireAuth, c.get);
r.patch("/:id/status", requireAuth, c.updateStatus);
r.get("/order/:orderId", requireAuth, c.listForOrder);

export default r;
