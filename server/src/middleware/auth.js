import { verifyJwt } from "../utils/token.js";
import { config } from "../config/env.js";
import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export async function requireAuth(req, res, next) {
  try {
    const cookieToken = req.cookies?.[config.COOKIE_NAME];
    const header = req.headers.authorization || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
    const token = cookieToken || bearer;
    if (!token) return res.status(401).json({ error: { message: "Unauthorized" } });

    const payload = verifyJwt(token);
    if (!payload?.id) return res.status(401).json({ error: { message: "Unauthorized" } });

    // roles in token are fine, but we also fetch current roles to be safe
    const { rows } = await pool.query(queries.rolesForUser, [payload.id]);
    req.user = { id: payload.id, roles: rows.map(r => r.role_name) };
    next();
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}


export async function withRoles(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: { message: "Unauthorized" } });
    const { rows } = await pool.query(`SELECT role_name FROM user_roles WHERE user_id = $1`, [req.user.id]);
    req.user.roles = rows.map((r) => NORM(r.role_name));
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const ok = roles.some(r => userRoles.includes(r));
    if (!ok) return res.status(403).json({ error: { message: "Forbidden" } });
    next();
  };
}

export function requireOrgRole(...allowed) {
  const allowedSet = new Set(allowed.map(NORM));
  return async (req, res, next) => {
    try {
      if (!req.user?.id) return res.status(401).json({ error: { message: "Unauthorized" } });
      const orgId = req.params?.orgId ?? req.body?.orgId ?? req.query?.orgId ?? req.orgId;
      if (!orgId) return res.status(400).json({ error: { message: "Missing orgId" } });

      const { rows } = await pool.query(
        `SELECT role_name FROM org_members WHERE org_id=$1 AND user_id=$2`,
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
