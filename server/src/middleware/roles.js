import { query } from '../db/pool.js';

// Loads the roles for the authenticated user and attaches them to req.user.roles
// Requires that requireAuth already ran and set req.user.id

export async function withRoles(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { rows } = await query(
      `SELECT role_name FROM user_roles WHERE user_id = $1`,
      [req.user.id]
    );

    req.user.roles = rows.map(r => r.role_name); 
    next();
  } catch (err) {
    next(err);
  }
}

// Enforce that the current user has at least one allowed role.
// Usage: requireRole('ADMIN','ORGANIZER')

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    const ok = roles.some(r => allowedRoles.includes(r));
    if (!ok) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }
    next();
  };
}
