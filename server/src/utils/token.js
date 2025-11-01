import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const ALG = "HS256";

export function signJwt({ id, role }) {
  return jwt.sign(
    { role },                               
    config.JWT_SECRET,
    {
      subject: String(id),              
      expiresIn: "7d",
      issuer: "RSVPd"
    }
  );
}

export function verifyJwt(token) {
  return jwt.verify(token, config.JWT_SECRET, { algorithms: [ALG] });
}
