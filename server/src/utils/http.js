export const ok = (res, data = {}) => res.json(data);
export const created = (res, data = {}) => res.status(201).json(data);
export const noContent = (res) => res.status(204).end();

export const badRequest = (res, message = "Bad Request") =>
  res.status(400).json({ error: { message } });
export const unauthorized = (res, message = "Unauthorized") =>
  res.status(401).json({ error: { message } });
export const forbidden = (res, message = "Forbidden") =>
  res.status(403).json({ error: { message } });
export const notFound = (res, message = "Not Found") =>
  res.status(404).json({ error: { message } });
export const serverError = (res, message = "Internal Server Error") =>
  res.status(500).json({ error: { message } });
