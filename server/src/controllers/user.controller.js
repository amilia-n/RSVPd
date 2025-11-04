import * as users from "../services/user.service.js";

export async function getMe(req, res) {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ error: { message: "Unauthorized" } });
    const user = await users.getById(id);
    if (!user) return res.status(404).json({ error: { message: "Not found" } });
    // include current roles (middleware may have added, but re-fetch to be accurate)
    const roles = await users.rolesForUser(id);
    return res.json({ user: { ...user, roles } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

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
    const { q, limit, offset } = req.query ?? {};
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

export async function listRoles(req, res) {
  try {
    const roles = await users.rolesForUser(req.params.id);
    return res.json({ roles });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

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
    const role = req.params.role || req.body?.role;
    if (!role) return res.status(400).json({ error: { message: "Missing role" } });
    await users.revokeGlobalRole(req.params.id, role);
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function createOrg(req, res) {
  try {
    const { name, slug } = req.body ?? {};
    if (!name || !slug) return res.status(400).json({ error: { message: "name and slug required" } });
    const org = await users.createOrg({ name, slug });
    return res.status(201).json({ org });
  } catch (e) {
    console.error(e);
    if (e.code === "23505") {
      return res.status(409).json({ error: { message: "Slug already in use" } });
    }
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listOrgs(req, res) {
  try {
    const { q, limit, offset } = req.query ?? {};
    const rows = await users.listOrgs(q ?? null, Number(limit) || 25, Number(offset) || 0);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function getOrgBySlug(req, res) {
  try {
    const org = await users.getOrgBySlug(req.params.slug);
    if (!org) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ org });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function getOrg(req, res) {
  try {
    const org = await users.getOrg(req.params.id);
    if (!org) return res.status(404).json({ error: { message: "Not found" } });
    return res.json({ org });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function updateOrg(req, res) {
  try {
    const { name, slug } = req.body ?? {};
    if (!name || !slug) return res.status(400).json({ error: { message: "name and slug required" } });
    const org = await users.updateOrg(req.params.id, { name, slug });
    return res.json({ org });
  } catch (e) {
    console.error(e);
    if (e.code === "23505") {
      return res.status(409).json({ error: { message: "Slug already in use" } });
    }
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listOrgMembers(req, res) {
  try {
    const rows = await users.listOrgMembers(req.params.orgId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function upsertOrgMember(req, res) {
  try {
    const { user_id, role_name } = req.body ?? {};
    if (!user_id || !role_name) {
      return res.status(400).json({ error: { message: "user_id and role_name required" } });
    }
    const row = await users.upsertOrgMember(req.params.orgId, user_id, role_name);
    return res.status(201).json({ member: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function removeOrgMember(req, res) {
  try {
    const { user_id, role_name } = req.body ?? {};
    if (!user_id || !role_name) {
      return res.status(400).json({ error: { message: "user_id and role_name required" } });
    }
    await users.removeOrgMember(req.params.orgId, user_id, role_name);
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listMyOrgs(req, res) {
  try {
    const rows = await users.listOrgsForUser(req.user.id);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}
export async function listVenuesForOrg(req, res) {
  try {
    const rows = await users.listVenuesForOrg(req.params.orgId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}