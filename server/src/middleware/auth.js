import { verifyJwt } from "../utils/tokens.js";
import { query } from "../db/pool.js";

const NORM = (r) => (typeof r === "string" ? r.toUpperCase() : r);

export function requireAuth(req, res, next) {
  const token = req.cookies?.access;
  if (!token) return res.status(401).json({ error: { message: "Unauthorized" } });
  try {
    const p = verifyJwt(token);
    const id = p.sub ?? p.id;
    if (!id) return res.status(401).json({ error: { message: "Invalid token" } });
    req.user = { ...p, id, role: p.role ? NORM(p.role) : null };
    next();
  } catch {
    return res.status(401).json({ error: { message: "Invalid token" } });
  }
}

export async function withRoles(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: { message: "Unauthorized" } });
    const { rows } = await query(`SELECT role_name FROM user_roles WHERE user_id = $1`, [req.user.id]);
    req.user.roles = rows.map((r) => NORM(r.role_name));
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRole(...allowed) {
  const allowedSet = new Set(allowed.map(NORM));
  return (req, res, next) => {
    if (!req.user?.roles) return res.status(401).json({ error: { message: "Unauthorized" } });
    for (const r of req.user.roles) if (allowedSet.has(NORM(r)) || NORM(r) === "ADMIN") return next();
    return res.status(403).json({ error: { message: "Forbidden" } });
  };
}

export function requireOrgRole(...allowed) {
  const allowedSet = new Set(allowed.map(NORM));
  return async (req, res, next) => {
    try {
      if (!req.user?.id) return res.status(401).json({ error: { message: "Unauthorized" } });
      const orgId = req.params?.orgId ?? req.body?.orgId ?? req.query?.orgId ?? req.orgId;
      if (!orgId) return res.status(400).json({ error: { message: "Missing orgId" } });

      const { rows } = await query(
        `SELECT role_name FROM organization_members WHERE org_id=$1 AND user_id=$2`,
        [orgId, req.user.id]
      );
      const userOrgRoles = new Set(rows.map((r) => NORM(r.role_name)));
      for (const r of userOrgRoles) if (allowedSet.has(r) || userOrgRoles.has("ADMIN")) return next();
      return res.status(403).json({ error: { message: "Forbidden" } });
    } catch (e) {
      next(e);
    }
  };
}

export const requireAdmin = requireRole("ADMIN");
