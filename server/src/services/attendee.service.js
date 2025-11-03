import pool from "../db/pool.js";
import { queries } from "../db/queries.js";

export async function findOrCreateAttendee(user_id, full_name, email, phone = null) {
  const { rows } = await pool.query(queries.findOrCreateAttendee, [
    user_id,
    full_name,
    email,
    phone,
  ]);
  return rows[0] || null;
}

export async function getAttendeeById(id) {
  const { rows } = await pool.query(queries.getAttendeeById, [id]);
  return rows[0] || null;
}

export async function getAttendeeByEmail(email) {
  const { rows } = await pool.query(queries.getAttendeeByEmail, [email]);
  return rows[0] || null;
}