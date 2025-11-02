import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export const getById = async (id) => {
  const { rows } = await pool.query(queries.userById, [id]);
  return rows[0] ?? null;
};

export const getByEmail = async (email) => {
  const { rows } = await pool.query(queries.userByEmail, [email]);
  return rows[0] ?? null;
};

export async function updateUser(id, patch = {}) {
  const {
    email,
    first_name,
    last_name,
    phone = null,
    timezone = "America/New_York",
    magicbell_external_id = null,
    stripe_customer_id = null,
  } = patch;

  const { rows } = await pool.query(queries.updateUser, [
    id,
    email,
    first_name,
    last_name,
    phone,
    timezone,
    magicbell_external_id,
    stripe_customer_id,
  ]);
  return rows[0];
}

export const listUsers = async (q, limit = 25, offset = 0) => {
  const { rows } = await pool.query(queries.listUsers, [
    q ?? null,
    limit,
    offset,
  ]);
  return rows;
};

export const verifyUser = async (id) => {
  const { rows } = await pool.query(queries.verifyUser, [id]);
  return rows[0] ?? null;
};

export const grantGlobalRole = async (userId, role) => {
  const { rows } = await pool.query(queries.grantGlobalRole, [userId, role]);
  return rows[0] ?? null;
};

export const revokeGlobalRole = async (userId, role) => {
  const res = await pool.query(queries.revokeGlobalRole, [userId, role]);
  return res.rowCount > 0;
};

export const rolesForUser = async (userId) => {
  const { rows } = await pool.query(queries.rolesForUser, [userId]);
  return rows.map((r) => r.role_name);
};

export const createOrg = async ({ name, slug }) => {
  const { rows } = await pool.query(queries.createOrg, [name, slug]);
  return rows[0];
};

export const updateOrg = async (id, { name, slug }) => {
  const { rows } = await pool.query(queries.updateOrg, [id, name, slug]);
  return rows[0];
};

export const orgById = async (id) => {
  const { rows } = await pool.query(queries.orgById, [id]);
  return rows[0] ?? null;
};

export const orgBySlug = async (slug) => {
  const { rows } = await pool.query(queries.orgBySlug, [slug]);
  return rows[0] ?? null;
};

export const listOrgs = async (q, limit = 25, offset = 0) => {
  const { rows } = await pool.query(queries.listOrgs, [
    q ?? null,
    limit,
    offset,
  ]);
  return rows;
};

export const upsertOrgMember = async (org_id, user_id, role_name) => {
  const { rows } = await pool.query(queries.upsertOrgMember, [
    org_id,
    user_id,
    role_name,
  ]);
  return rows[0];
};

export const removeOrgMember = async (org_id, user_id, role_name) => {
  const res = await pool.query(queries.removeOrgMember, [
    org_id,
    user_id,
    role_name,
  ]);
  return res.rowCount > 0;
};

export const listOrgMembers = async (org_id) => {
  const { rows } = await pool.query(queries.listOrgMembers, [org_id]);
  return rows;
};
