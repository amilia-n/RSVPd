import argon2 from "argon2";

export async function hashPassword(plain) {
  return argon2.hash(plain);
}
export async function verifyPassword(plain, hash) {
  return argon2.verify(hash, plain);
}