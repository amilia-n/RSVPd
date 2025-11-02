export function ok(res, data = {}) {
  return res.json(data);
}
export function created(res, data = {}) {
  return res.status(201).json(data);
}
export function noContent(res) {
  return res.status(204).send();
}
export function badRequest(res, message = "Bad Request") {
  return res.status(400).json({ error: { message } });
}
export function unauthorized(res, message = "Unauthorized") {
  return res.status(401).json({ error: { message } });
}
export function forbidden(res, message = "Forbidden") {
  return res.status(403).json({ error: { message } });
}
export function notFound(res, message = "Not found") {
  return res.status(404).json({ error: { message } });
}
export function conflict(res, message = "Conflict") {
  return res.status(409).json({ error: { message } });
}
export function serverError(res, err) {
  console.error(err);
  return res.status(500).json({ error: { message: "Internal Server Error" } });
}
