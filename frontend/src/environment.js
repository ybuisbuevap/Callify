// The real backend origin — always absolute. Socket.IO needs this directly;
// a WebSocket connection can't be routed through an HTTP rewrite the way a
// normal REST call can.
export const backendUrl =
  process.env.NODE_ENV === "production"
    ? "https://callify-backend-709m.onrender.com"
    : "http://localhost:8000";

// Used for REST API calls (axios/fetch). In production this is a relative
// path on purpose: requests stay same-origin (Vercel proxies /api/* to the
// backend — see vercel.json), so the auth cookie is first-party instead of
// cross-site. Safari and Firefox block third-party cookies by default, and
// a growing share of Chrome users do too — this avoids that entirely rather
// than relying on every visitor's browser/privacy settings happening to
// allow it.
const server =
  process.env.NODE_ENV === "production"
    ? ""
    : backendUrl;

export default server;
