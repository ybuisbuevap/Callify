const isProd = process.env.NODE_ENV === "production";

// Frontend REST calls are proxied through Vercel (see frontend/vercel.json),
// so from the browser's point of view they're same-origin in both dev
// (localhost:3000 -> localhost:8000, same-site since only the port differs)
// and production (callify-connect.vercel.app -> proxied to Render, same
// origin as far as the browser's cookie jar is concerned). That means Lax
// works everywhere — no need for the cross-site None/Secure combination,
// which Safari/Firefox (and an increasing share of Chrome users) block by
// default regardless of how correctly it's configured.
export const authCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day — matches the JWT's own expiry
};

// Used when clearing the cookie on logout — must match the same attributes
// used when it was set, or the browser won't recognize it as the same cookie.
export const clearAuthCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
};
