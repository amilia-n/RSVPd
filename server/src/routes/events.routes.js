import { Router } from "express";
import * as c from "../controllers/events.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.post("/", requireAuth, c.create);
r.get("/:id", c.get);
r.patch("/:id", requireAuth, c.update);
r.post("/:id/publish", requireAuth, c.publish);
r.post("/:id/cancel", requireAuth, c.cancel);


r.get("/org/:orgId", requireAuth, c.listForOrg);
r.get("/public/search", c.searchPublic);
r.get("/public/upcoming", c.upcomingPublic);

r.post("/speakers", requireAuth, c.createSpeaker);
r.get("/speakers/:id", c.getSpeaker);
r.patch("/speakers/:id", requireAuth, c.updateSpeaker);
r.delete("/speakers/:id", requireAuth, c.deleteSpeaker);
r.get("/org/:orgId/speakers", requireAuth, c.listSpeakersForOrg);

r.post("/sessions", requireAuth, c.createSession);
r.get("/sessions/:id", c.getSession);
r.patch("/sessions/:id", requireAuth, c.updateSession);
r.delete("/sessions/:id", requireAuth, c.deleteSession);
r.get("/:eventId/sessions", c.listSessionsForEvent);

r.get("/:eventId/analytics", requireAuth, c.analytics);

export default r;
