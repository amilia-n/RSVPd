import { Router } from "express";
import * as c from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();
r.post("/register", c.register);
r.post("/login", c.login);
r.post("/logout", c.logout);
r.get("/me", requireAuth, c.me);

export default r;
