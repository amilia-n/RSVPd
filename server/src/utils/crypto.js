import crypto from "crypto";

export function randomHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hmacSha256(secret, data) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}
