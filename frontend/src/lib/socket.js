import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// Lazily connected so we don't open a socket until the user actually
// consents (age gate) and lands in the queue.
export const socket = io(SERVER_URL, { autoConnect: false });

/** A lightweight, non-cryptographic browser fingerprint. Not spoof-proof —
 * pair with server-side IP hashing for ban enforcement (see moderation.js). */
export function getFingerprint() {
  const key = "rc_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(key, fp);
  }
  return fp;
}

/** The name the person entered on their way in — persisted so it carries
 * across the 1-to-1 call, every group room, and repeat visits. */
export function getDisplayName() {
  return localStorage.getItem("rc_name") || "";
}

export function setDisplayName(name) {
  const clean = (name || "").trim().slice(0, 30);
  if (clean) localStorage.setItem("rc_name", clean);
  return clean;
}
