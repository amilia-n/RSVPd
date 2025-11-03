import axios from "axios";
import { ENV } from "../config/env";

function originFromEnv(apiUrl) {
  try {
    return new URL(apiUrl, window.location.origin).origin;
  } catch {
    return undefined;
  }
}

const client = axios.create({
  baseURL: originFromEnv(ENV.API_URL), // http://localhost:8888  (no /api here)
  timeout: 30000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Unwrap data, handle 204, and force logout on 401
client.interceptors.response.use(
  (response) => (response.data === "" ? null : response.data),
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Universal API caller
const apiClient = ({ method, url, data, params, headers }) =>
  client({ method, url, data, params, headers });

export default apiClient;
