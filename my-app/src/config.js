// ─── CROSS-DEVICE ACCESS (LAN demo) ──────────────────────────────────────
// Single source of truth for where the backend lives.
//
// Why this is derived instead of hardcoded: this file is bundled and RUNS IN
// THE VISITOR'S BROWSER. A literal "localhost:8000" therefore means *the
// visitor's own machine* — fine on the dev laptop, but on a second device it
// points at a machine with no backend, so every request dies with
// ERR_CONNECTION_REFUSED before it ever leaves that device.
//
// window.location.hostname is whatever host the page was actually loaded
// from — "localhost" on the dev machine, "192.168.1.9" on a laptop that
// opened http://192.168.1.9:3000. Deriving from it means the app configures
// itself for both, with nothing to edit when the DHCP lease hands out a new
// IP before a demo.
//
// REACT_APP_API_URL still overrides it, for the case where the API is not on
// the same host as the frontend (a deployed backend, a tunnel, etc.).
// CRA inlines that at BUILD time and only reads .env at dev-server startup,
// so `npm start` must be restarted after changing it.
// ─────────────────────────────────────────────────────────────────────────

const BACKEND_PORT = 8000;

// Guard for non-browser contexts (CRA's jest/node test env has no window).
const inferredOrigin =
    typeof window !== "undefined" && window.location?.hostname
        ? `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`
        : `http://localhost:${BACKEND_PORT}`;

// Origin only — no trailing slash, no /api. Socket.IO connects to this.
export const API_ORIGIN = process.env.REACT_APP_API_URL || inferredOrigin;

// REST root. Every fetch in the app builds on this.
export const API_BASE = `${API_ORIGIN}/api`;

// Auth/profile routes live under a version prefix.
export const API_USERS = `${API_BASE}/v1/users`;
