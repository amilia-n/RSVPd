import { Router } from "express";
import * as c from "../controllers/survey.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.post("/", requireAuth, c.create);

r.get("/event/:eventId", requireAuth, c.listForEvent);
r.get("/org/:orgId", requireAuth, c.listForOrg);
r.get("/user/me", requireAuth, c.listForUser);
r.post("/send", requireAuth, c.sendSurvey);
r.post("/draft", requireAuth, c.saveDraft);
r.post("/submit", requireAuth, c.submitResponse);

r.get("/:id", requireAuth, c.get);
r.patch("/:id", requireAuth, c.update);
r.delete("/:id", requireAuth, c.deleteSurvey);
r.get("/:id/stats", requireAuth, c.getStats);
r.get("/:id/responses", requireAuth, c.getResponses);

export default r;