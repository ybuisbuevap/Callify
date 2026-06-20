const isProd = process.env.NODE_ENV === "production";

// Frontend (Vercel) and backend (Render) are different domains in production,
// which makes this a cross-site request — cookies need SameSite=None + Secure
// for the browser to send them at all. In local dev, frontend and backend are
// both on "localhost" (just different ports), which counts as same-site, so
// the stricter/simpler Lax + non-Secure settings work fine over plain HTTP.
export const authCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day — matches the JWT's own expiry
};

// Used when clearing the cookie on logout — must match the same attributes
// used when it was set, or the browser won't recognize it as the same cookie.
export const clearAuthCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
};
