import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { addToHistory, getUserHistory, login, logout, register, getMe, verifyEmail, resendVerification, forgotPassword, resetPassword, updateProfile, deleteAccount } from "../controllers/users.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { authCookieOptions } from "../utils/cookieOptions.js";

const router = Router();

// 10 attempts per 15 min per IP — slows down brute force / credential stuffing
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many attempts. Please try again later." }
});

// 5 per hour per IP — stops email-bombing via forgot-password / resend-verification
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: "Too many requests. Please try again later." }
});

router.route("/login").post(loginLimiter, login);
router.post("/logout", logout);
router.route("/register").post(loginLimiter, register);
router.route("/history")
    .get(verifyToken, getUserHistory)
    .post(verifyToken, addToHistory);

router.route("/me").get(verifyToken, getMe);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", emailLimiter, resendVerification);
router.post("/forgot-password", emailLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/profile", verifyToken, updateProfile);
router.delete("/profile", verifyToken, deleteAccount);

// Google OAuth
router.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
router.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/auth?error=google_failed`, session: false }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id, username: req.user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        // Set the cookie directly instead of passing the JWT in the redirect
        // URL — a token in the URL can end up in browser history, the Vercel
        // edge/CDN access logs, or a Referer header if any third-party
        // resource loads on that page.
        res.cookie("token", token, authCookieOptions);
        res.redirect(`${process.env.CLIENT_URL}/home`);
    }
);

export default router;