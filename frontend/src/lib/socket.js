
import { io } from "socket.io-client";

const SERVER_URL = "https://randomchat-bfn9.onrender.com";

// Lazily connected
export const socket = io(SERVER_URL, {
  autoConnect: false,
});

/**
 * A lightweight, non-cryptographic browser fingerprint.
 * Not spoof-proof — pair with server-side IP hashing for ban enforcement.
 */
export function getFingerprint() {
  const key = "rc_fp";
  let fp = localStorage.getItem(key);

  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(key, fp);
  }

  return fp;
}

/**
 * The name the person entered on their way in.
 */
export function getDisplayName() {
  return localStorage.getItem("rc_name") || "";
}

export function setDisplayName(name) {
  const clean = (name || "").trim().slice(0, 30);

  if (clean) {
    localStorage.setItem("rc_name", clean);
  }

  return clean;
}
