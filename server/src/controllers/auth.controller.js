import * as AuthService from "../services/auth.service.js";
import * as UserService from "../services/user.service.js";
import { config } from "../config/env.js";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req, res) {
  const { email, password, first_name, last_name, phone, timezone } = req.body ?? {};
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: { message: "Missing required fields" } });
  }
  const { user, token } = await AuthService.register({
    email,
    password,
    first_name,
    last_name,
    phone,
    timezone,
  });
  res.cookie("access", token, COOKIE_OPTS);
  return res.status(201).json({ user });
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password required" } });
  }
  const { user, token } = await AuthService.login({ email, password });
  res.cookie("access", token, COOKIE_OPTS);
  return res.json({ user });
}

export async function logout(_req, res) {
  res.clearCookie("access", { path: "/" });
  return res.status(204).send();
}

export async function me(req, res) {
  const id = req.user?.id;
  if (!id) return res.status(401).json({ error: { message: "Unauthorized" } });
  const user = await UserService.getById(id);
  if (!user) return res.status(404).json({ error: { message: "User not found" } });
  return res.json({ user });
}
