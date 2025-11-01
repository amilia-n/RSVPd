import { SQL } from "../db/queries.js";
import { query } from "../db/pool.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signJwt } from "../utils/token.js";

export async function register({ email, password, first_name, last_name, phone, timezone }) {
  const password_hash = await hashPassword(password);
  const { rows } = await query(SQL.insertUser, [
    email, password_hash, first_name, last_name, phone ?? null, timezone ?? "America/New_York", null, null,
  ]);
  const user = rows[0];
  return { user, token: signJwt({ id: user.id, role: null }) };
}

export async function login({ email, password }) {
  const { rows } = await query(SQL.userByEmail, [email]);
  const user = rows[0];
  if (!user) return null;
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;
  return { user, token: signJwt({ id: user.id, role: null }) };
}

export async function me(userId) {
  const { rows } = await query(SQL.userById, [userId]);
  return rows[0] || null;
}
