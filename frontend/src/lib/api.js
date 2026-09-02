const BASE_URL = "https://randomchat-bfn9.onrender.com";

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
