import pool from "../db/pool.js";
import { queries } from "../db/queries.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signJwt } from "../utils/token.js";

export async function register({ email, password, first_name, last_name, phone }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const password_hash = await hashPassword(password);
    const { rows } = await client.query(queries.insertUser, [
      email, password_hash, first_name, last_name, phone ?? null, null, null,
    ]);
    const user = rows[0];

    // Automatically grant ATTENDEE role to new users
    await client.query(
      'INSERT INTO user_roles (user_id, role_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, 'ATTENDEE']
    );

    await client.query('COMMIT');

    // Fetch user with roles
    const { rows: userRows } = await client.query(queries.userByIdWithRoles, [user.id]);
    const userWithRoles = userRows[0];

    return { user: userWithRoles, token: signJwt({ id: user.id, role: null }) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function login({ email, password }) {
  const { rows } = await pool.query(queries.userByEmailWithRoles, [email]);
  const user = rows[0];
  if (!user) return null;
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;
  return { user, token: signJwt({ id: user.id, role: null }) };
}

export async function me(userId) {
  const { rows } = await pool.query(queries.userByIdWithRoles, [userId]);
  return rows[0] || null;
}
