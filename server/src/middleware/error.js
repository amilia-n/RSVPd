export default function errorHandler(err, req, res, _next) {
  if (err?.code === "23505") {
    return res.status(409).json({ ok: false, error: { code: "UNIQUENESS_VIOLATION", message: err.detail || "Unique constraint violated" }});
  }
  if (err?.code === "23503") {
    return res.status(409).json({ ok: false, error: { code: "FK_VIOLATION", message: err.detail || "Foreign key constraint violated" }});
  }
  if (err?.code === "23514") {
    return res.status(400).json({ ok: false, error: { code: "CHECK_VIOLATION", message: err.message }});
  }

  console.error(err);
  res.status(500).json({ ok: false, error: { code: "INTERNAL", message: "Something went wrong" } });
}
