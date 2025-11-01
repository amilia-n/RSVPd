import QRCode from "qrcode";
import crypto from "crypto";
import { config } from "../config/env.js";


function canonicalize(obj, omit = []) {
  const clean = Object.fromEntries(
    Object.entries(obj).filter(([k]) => !omit.includes(k))
  );
  const sorted = Object.keys(clean)
    .sort()
    .reduce((acc, k) => ((acc[k] = clean[k]), acc), {});
  return JSON.stringify(sorted);
}

export function signQrPayload(payload) {
  const msg = canonicalize(payload, ["sig"]);
  return crypto.createHmac("sha256", config.QR_HMAC_SECRET).update(msg).digest("base64url");
}

export function verifyQrPayload(payload) {
  if (!payload?.sig) return false;
  const expected = signQrPayload({ ...payload, sig: undefined });
  const a = Buffer.from(payload.sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function makeTicketPayload({ qr_token, event_id }) {
  const p = { v: 1, t: qr_token, e: event_id };
  return { ...p, sig: signQrPayload(p) };
}


const DEFAULTS = {
  errorCorrectionLevel: "M",
  margin: 1,
};

export async function toDataURL(data, opts = {}) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return QRCode.toDataURL(text, { ...DEFAULTS, width: 256, ...opts });
}

export async function toPNGBuffer(data, opts = {}) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return QRCode.toBuffer(text, { ...DEFAULTS, type: "png", width: 512, ...opts });
}

export async function toSVGString(data, opts = {}) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return QRCode.toString(text, { ...DEFAULTS, type: "svg", ...opts });
}

export async function makeTicketQrDataURL(ticket, opts) {
  const payload = makeTicketPayload({ qr_token: ticket.qr_token, event_id: ticket.event_id });
  return toDataURL(payload, opts);
}

export async function makeTicketQrPNG(ticket, opts) {
  const payload = makeTicketPayload({ qr_token: ticket.qr_token, event_id: ticket.event_id });
  return toPNGBuffer(payload, opts); // Buffer
}

export async function makeTicketQrSVG(ticket, opts) {
  const payload = makeTicketPayload({ qr_token: ticket.qr_token, event_id: ticket.event_id });
  return toSVGString(payload, opts); // string
}

export function shortCodeFromId(id) {
  const b = crypto.createHash("sha1").update(String(id)).digest("base64url");
  return `${b.slice(0, 4)}-${b.slice(4, 8)}`.toUpperCase();
}
