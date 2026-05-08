import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { addToHistory, getUserHistory, login, register, getMe, verifyEmail, resendVerification, forgotPassword, resetPassword, updateProfile, deleteAccount } from "../controllers/users.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/history")
    .get(verifyToken, getUserHistory)
    .post(verifyToken, addToHistory);

router.route("/me").get(verifyToken, getMe);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
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
        res.redirect(`${process.env.CLIENT_URL}/auth?token=${token}`);
    }
);

export default router;