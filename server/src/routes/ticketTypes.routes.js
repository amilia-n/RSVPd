import { Router } from "express";
import * as c from "../controllers/ticketTypes.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.post("/", requireAuth, c.create);
r.get("/:id", c.get);
r.patch("/:id", requireAuth, c.update);
r.post("/:id/deactivate", requireAuth, c.deactivate);

r.get("/event/:eventId", c.listForEvent);
r.get("/:id/availability", c.availability);

export default r;
