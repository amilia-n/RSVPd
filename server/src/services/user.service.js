import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export async function getById(id) {
  const { rows } = await pool.query(queries.userByIdWithRoles, [id]);
  return rows[0] || null;
}

export async function getByEmail(email) {
  const { rows } = await pool.query(queries.userByEmail, [email]);
  return rows[0] || null;
}

export async function listUsers(q = null, limit = 25, offset = 0) {
  const { rows } = await pool.query(queries.listUsers, [q, limit, offset]);
  return rows;
}

export async function updateUser(id, patch) {
  const {
    email,
    first_name,
    last_name,
    phone = null,
    magicbell_external_id = null,
    stripe_customer_id = null,
  } = patch;
  const { rows } = await pool.query(queries.updateUser, [
    id,
    email,
    first_name,
    last_name,
    phone,
    magicbell_external_id,
    stripe_customer_id,
  ]);
  return rows[0] || null;
}

export async function verifyUser(id) {
  const { rows } = await pool.query(queries.verifyUser, [id]);
  return rows[0] || null;
}

export async function rolesForUser(user_id) {
  const { rows } = await pool.query(queries.rolesForUser, [user_id]);
  return rows.map(r => r.role_name);
}

export async function grantGlobalRole(user_id, role_name) {
  const { rows } = await pool.query(queries.grantGlobalRole, [user_id, role_name]);
  return rows[0] || null;
}

export async function revokeGlobalRole(user_id, role_name) {
  await pool.query(queries.revokeGlobalRole, [user_id, role_name]);
  return { ok: true };
}

export async function createOrg({ name, slug }) {
  const { rows } = await pool.query(queries.createOrg, [name, slug]);
  return rows[0] || null;
}

export async function updateOrg(id, { name, slug }) {
  const { rows } = await pool.query(queries.updateOrg, [id, name, slug]);
  return rows[0] || null;
}

export async function getOrg(id) {
  const { rows } = await pool.query(queries.orgById, [id]);
  return rows[0] || null;
}

export async function getOrgBySlug(slug) {
  const { rows } = await pool.query(queries.orgBySlug, [slug]);
  return rows[0] || null;
}

export async function listOrgs(q = null, limit = 25, offset = 0) {
  const { rows } = await pool.query(queries.listOrgs, [q, limit, offset]);
  return rows;
}

export async function listOrgMembers(org_id) {
  const { rows } = await pool.query(queries.listOrgMembers, [org_id]);
  return rows;
}

export async function upsertOrgMember(org_id, user_id, role_name) {
  const { rows } = await pool.query(queries.upsertOrgMember, [org_id, user_id, role_name]);
  return rows[0] || null;
}

export async function removeOrgMember(org_id, user_id, role_name) {
  await pool.query(queries.removeOrgMember, [org_id, user_id, role_name]);
  return { ok: true };
}

export async function listOrgsForUser(userId) {
  const { rows } = await pool.query(queries.listOrgsForUser, [userId]);
  return rows;
}

export async function listVenuesForOrg(orgId) {
  const { rows } = await pool.query(queries.listVenuesForOrg, [orgId]);
  return rows;
}