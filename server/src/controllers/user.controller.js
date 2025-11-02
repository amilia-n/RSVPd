import * as UserService from "../services/user.service.js";

export async function listUsers(req, res) {
  const q = req.query?.q ?? null;
  const limit = Number(req.query?.limit ?? 20);
  const offset = Number(req.query?.offset ?? 0);
  const data = await UserService.list({ q, limit, offset });
  return res.json(data);
}

export async function getUser(req, res) {
  const { id } = req.params;
  const user = await UserService.getById(id);
  if (!user) return res.status(404).json({ error: { message: "User not found" } });
  return res.json(user);
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const body = req.body ?? {};
  const user = await UserService.update(id, body);
  return res.json(user);
}

export async function grantGlobalRole(req, res) {
  const { id } = req.params;
  const { role } = req.body ?? {};
  if (!role) return res.status(400).json({ error: { message: "role required" } });
  const granted = await UserService.grantRole(id, role);
  return res.status(201).json(granted);
}

export async function revokeGlobalRole(req, res) {
  const { id } = req.params;
  const { role } = req.body ?? {};
  if (!role) return res.status(400).json({ error: { message: "role required" } });
  await UserService.revokeRole(id, role);
  return res.status(204).send();
}

export async function upsertOrgMember(req, res) {
  const { orgId } = req.params;
  const { user_id, role } = req.body ?? {};
  if (!user_id || !role) {
    return res.status(400).json({ error: { message: "user_id and role required" } });
  }
  const m = await UserService.upsertOrgMember(orgId, user_id, role);
  return res.status(201).json(m);
}

export async function removeOrgMember(req, res) {
  const { orgId } = req.params;
  const { user_id, role } = req.body ?? {};
  if (!user_id || !role) {
    return res.status(400).json({ error: { message: "user_id and role required" } });
  }
  await UserService.removeOrgMember(orgId, user_id, role);
  return res.status(204).send();
}

export async function listOrgMembers(req, res) {
  const { orgId } = req.params;
  const members = await UserService.listOrgMembers(orgId);
  return res.json(members);
}
