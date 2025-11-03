import { verifyJwt } from "../utils/token.js";
import { config } from "../config/env.js";
import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

function NORM(s) {
  return String(s || "").trim().toUpperCase();
}

function getOrgId(req) {
  return (
    req.params?.orgId ??
    req.params?.organizationId ??
    req.body?.orgId ??
    req.body?.organizationId ??
    req.query?.orgId ??
    req.query?.organizationId ??
    req.orgId ??
    null
  );
}

export async function requireAuth(req, res, next) {
  try {
    const cookieToken = req.cookies?.[config.COOKIE_NAME];
    const header = req.headers.authorization || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
    const token = cookieToken || bearer;
    if (!token) return res.status(401).json({ error: { message: "Unauthorized" } });

    const payload = verifyJwt(token);
    if (!payload?.sub) return res.status(401).json({ error: { message: "Unauthorized" } });

    const { rows } = await pool.query(queries.rolesForUser, [payload.sub]);
    const roles = rows.map((r) => NORM(r.role_name));

    req.user = { id: payload.sub, roles };
    return next();
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

export async function withRoles(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: { message: "Unauthorized" } });
    if (Array.isArray(req.user.roles) && req.user.roles.length) return next();

    const { rows } = await pool.query(queries.rolesForUser, [req.user.id]);
    req.user.roles = rows.map((r) => NORM(r.role_name));
    return next();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export function requireRole(...roles) {
  const need = roles.map(NORM);
  return (req, res, next) => {
    const have = (req.user?.roles || []).map(NORM);
    const ok = need.some((r) => have.includes(r));
    if (!ok) return res.status(403).json({ error: { message: "Forbidden" } });
    return next();
  };
}


export function requireOrgRole(...allowed) {
  const allowedSet = new Set(allowed.map(NORM));
  return async (req, res, next) => {
    try {
      if (!req.user?.id) return res.status(401).json({ error: { message: "Unauthorized" } });

      const globalRoles = (req.user.roles || []).map(NORM);
      if (globalRoles.includes("ADMIN")) return next();

      const orgId = getOrgId(req);
      if (!orgId) return res.status(400).json({ error: { message: "Missing orgId" } });

      const { rows } = await pool.query(queries.orgRolesForUser, [req.user.id, orgId]);
      const orgRoles = new Set(rows.map((r) => NORM(r.role_name)));

      for (const r of orgRoles) {
        if (allowedSet.has(r)) return next();
      }
      return res.status(403).json({ error: { message: "Forbidden" } });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: { message: "Internal Server Error" } });
    }
  };
}

export const requireAdmin = requireRole("ADMIN");
