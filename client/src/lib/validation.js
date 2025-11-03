export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));
export const nonEmpty = (v) => String(v || "").trim().length > 0;
export const isId = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

export function requireFields(obj, ...keys) {
  const missing = keys.filter((k) => !nonEmpty(obj?.[k]));
  return { ok: missing.length === 0, missing };
}
