import { verifyJwt } from "../utils/tokens.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.access;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const p = verifyJwt(token);
    const id = p.sub ?? p.id;
    if (!id) return res.status(401).json({ message: "Invalid token" });
    req.user = { ...p, id, role: p.role };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export const requireAdmin = requireRole("admin");

export function requireSelfOrAdmin(param = "id") {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Missing token" });
    if (req.user.role === "admin") return next();

    const targetId =
      req.params?.[param] ?? req.body?.[param] ?? req.query?.[param];
    if (targetId == null) {
      return res.status(400).json({ message: `Missing ${param}` });
    }
    if (String(targetId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
