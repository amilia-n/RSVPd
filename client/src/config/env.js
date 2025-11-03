export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:7777",
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
  MAGICBELL_API_KEY: import.meta.env.VITE_MAGICBELL_API_KEY || "",
};