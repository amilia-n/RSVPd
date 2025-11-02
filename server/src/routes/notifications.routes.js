import { Router } from "express";
import * as c from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.post("/", requireAuth, c.enqueue);
r.get("/:id", requireAuth, c.get);
r.patch("/:id/sent", requireAuth, c.markSent);
r.patch("/:id/status", requireAuth, c.updateStatus);
r.get("/user/me", requireAuth, c.listForUser);
r.get("/event/:eventId", requireAuth, c.listForEvent);
r.get("/queued/list", requireAuth, c.listQueued);

r.post("/devices", requireAuth, c.upsertDevice);
r.get("/devices/me", requireAuth, c.listDevices);
r.delete("/devices/:id", requireAuth, c.deleteDevice);
r.patch("/devices/:id/seen", requireAuth, c.updateDeviceLastSeen);
r.patch("/devices/:id/disable", requireAuth, c.disableDevice);
r.patch("/devices/:id/fail", requireAuth, c.incrementDeviceFailCount);

r.get("/prefs/me", requireAuth, c.getUserPrefs);
r.put("/prefs/me", requireAuth, c.upsertUserPrefs);

export default r;
