import axios from "axios";

// Safely extract error message from FastAPI responses
// detail can be a string OR array of Pydantic validation objects
export const getErrorMsg = (err, fallback = "Something went wrong") => {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || JSON.stringify(d)).join(", ");
  return fallback;
};

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  try {
    const persisted = localStorage.getItem("trademind-auth");
    const token = persisted ? JSON.parse(persisted)?.state?.token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      !window.location.pathname.includes("/login") &&
      !err.config?.url?.includes("/auth/")
    ) {
      localStorage.removeItem("trademind-auth");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
