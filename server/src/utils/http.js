export const ok = (res, data) => res.status(200).json({ ok: true, data });

export const created = (res, data) => res.status(201).json({ ok: true, data });

export const bad = (res, message, code = "BAD_REQUEST") =>
  res.status(400).json({ ok: false, error: { code, message } });

export const forbidden = (res, message = "Forbidden") =>
  res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message } });

export const notfound = (res, message = "Not found") =>
  res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message } });
