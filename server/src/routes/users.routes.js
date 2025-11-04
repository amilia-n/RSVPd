import { Router } from "express";
import * as c from "../controllers/user.controller.js";
import { requireAuth, withRoles, requireRole } from "../middleware/auth.js";

const r = Router();
r.use(requireAuth, withRoles);

// users
r.get("/me", c.getMe);
r.get("/", requireRole("ADMIN"), c.list);
r.get("/:id", requireRole("ADMIN"), c.getUser);
r.patch("/:id", c.update);
r.post("/:id/verify", requireRole("ADMIN"), c.verify);

// global roles
r.get("/:id/roles", requireRole("ADMIN"), c.listRoles);
r.post("/:id/roles", requireRole("ADMIN"), c.grantRole);
r.delete("/:id/roles/:role", requireRole("ADMIN"), c.revokeRole);

// orgs
r.post("/orgs", requireRole("ADMIN", "ORGANIZER"), c.createOrg);
r.get("/orgs/me", c.listMyOrgs);
r.get("/orgs", c.listOrgs);
r.get("/orgs/slug/:slug", c.getOrgBySlug);
r.get("/orgs/:id", c.getOrg);
r.patch("/orgs/:id", requireRole("ADMIN", "ORGANIZER"), c.updateOrg);

// org members
r.get("/orgs/:orgId/members", c.listOrgMembers);
r.post("/orgs/:orgId/members", requireRole("ADMIN", "ORGANIZER"), c.upsertOrgMember);
r.delete("/orgs/:orgId/members", requireRole("ADMIN", "ORGANIZER"), c.removeOrgMember);

r.get("/orgs/:orgId/venues", c.listVenuesForOrg);
export default r;
