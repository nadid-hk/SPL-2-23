// ─── CROSS-DEVICE ACCESS (LAN demo) ──────────────────────────────────────
// Shared CORS policy for BOTH the REST API (app.js) and the Socket.IO
// handshake (index.js). They must agree: the chat page loads its history
// over REST and then sends over the websocket, so allowing one without the
// other leaves chat half-broken in a way that is painful to diagnose.
//
// Why a function instead of a string: auth is cookie-based, so responses
// carry `Access-Control-Allow-Credentials: true`. The CORS spec forbids
// pairing that with a wildcard `Access-Control-Allow-Origin: *` — the
// browser rejects the response. The server therefore has to echo back the
// caller's exact origin, which means deciding per-request.
//
// Scope: localhost plus the RFC1918 private ranges. That covers the dev
// machine and any laptop on the same wifi, and nothing routable from the
// public internet.
// ─────────────────────────────────────────────────────────────────────────

const PRIVATE_HOST_PATTERNS = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/
];

// Any port is accepted on those hosts on purpose: CRA silently falls back to
// 3001 when 3000 is taken, which would otherwise break the demo with a CORS
// error that looks nothing like "wrong port".
// Read lazily, NOT at module scope: ES imports are hoisted above the
// dotenv.config() call in index.js, so at module-evaluation time .env has
// not been loaded yet and this would always be empty.
const extraOrigins = () =>
    (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

export const isOriginAllowed = (origin) => {
    // No Origin header at all: same-origin navigation, curl, health checks.
    // Not a cross-site request, so there is nothing to guard against.
    if (!origin) return true;

    const extra = extraOrigins();
    if (extra.includes("*") || extra.includes(origin)) return true;

    return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(origin));
};

// express `cors` middleware signature.
export const corsOrigin = (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin not allowed -> ${origin}`));
};

export const corsOptions = {
    origin: corsOrigin,
    credentials: true
};
