import { Router } from "express";
import * as c from "../controllers/checkins.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.post("/scan", requireAuth, c.scan);
r.get("/event/:eventId", requireAuth, c.listForEvent);
r.get("/me", requireAuth, c.listByUser);
r.get("/event/:eventId/stats", requireAuth, c.stats);

export default r;
