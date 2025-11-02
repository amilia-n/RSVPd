import * as users from "../services/user.service.js";

export async function getUser(req, res) {
  try {
    const user = await users.getById(req.params.id);
    if (!user) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function list(req, res) {
  try {
    const { q, limit, offset } = req.query;
    const rows = await users.listUsers(q ?? null, Number(limit) || 25, Number(offset) || 0);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function update(req, res) {
  try {
    const u = await users.updateUser(req.params.id, req.body ?? {});
    return res.json({ user: u });
  } catch (e) {
    console.error(e);
    if (e.code === "23505") {
      return res.status(409).json({ error: { message: "Email already in use" } });
    }
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function verify(req, res) {
  try {
    const u = await users.verifyUser(req.params.id);
    return res.json({ user: u });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

// Roles
export async function grantRole(req, res) {
  try {
    const { role } = req.body ?? {};
    if (!role) return res.status(400).json({ error: { message: "Missing role" } });
    const r = await users.grantGlobalRole(req.params.id, role);
    return res.status(201).json({ role: r });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function revokeRole(req, res) {
  try {
    const { role } = req.body ?? {};
    if (!role) return res.status(400).json({ error: { message: "Missing role" } });
    await users.revokeGlobalRole(req.params.id, role);
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}
