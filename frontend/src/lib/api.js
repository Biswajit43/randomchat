const DEFAULT_API_BASE = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? "https://randomchat-bfn9.onrender.com"
  : "http://localhost:5000";

const BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).replace(/\/+$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listRooms: () => request("/rooms"),
  getRoom: (id) => request(`/rooms/${id}`),
  createRoom: (payload) => request("/rooms", { method: "POST", body: JSON.stringify(payload) }),
};
