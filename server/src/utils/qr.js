// import QRCode from 'qrcode';
// import crypto from 'node:crypto';
// import { config } from '../config/env.js';

// export function buildTicketDeepLink(qrToken) {
//   return `${config.APP_BASE_URL}/t/${qrToken}`;
// }

// Optional: HMAC for short payloads (not strictly needed if you embed URL)
// export function signQrPayload(payload) {
//   const h = crypto.createHmac('sha256', config.QR_HMAC_SECRET);
//   h.update(payload);
//   return h.digest('hex');
// }

// export async function renderQrPng(text, width = 512) {
//   return QRCode.toBuffer(text, {
//     type: 'png',
//     errorCorrectionLevel: 'M',
//     width,
//     margin: 1
//   });
// }

// export async function renderQrSvg(text, width = 256) {
//   return QRCode.toString(text, {
//     type: 'svg',
//     errorCorrectionLevel: 'M',
//     width,
//     margin: 0
//   });
// }

// export function pngBufferToDataUrl(buf) {
//   return `data:image/png;base64,${buf.toString('base64')}`;
// }
