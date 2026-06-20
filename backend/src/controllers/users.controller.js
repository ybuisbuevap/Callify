import httpStatus from "http-status";
import User from "../models/user.model.js";
import bcrypt, { hash } from "bcrypt"
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";
import nodemailer from "nodemailer";
import { sendVerificationEmail, sendResetPasswordEmail } from "../utils/sendEmail.js";
import logger from "../utils/logger.js";
import { authCookieOptions, clearAuthCookieOptions } from "../utils/cookieOptions.js";

const login = async (req, res) => {

    const { username, password } = req.body;

    if (typeof username !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Invalid input" });
    }

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide" })
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User Not Found" })
        }

        if(!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid Username or password" })
        }

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, authCookieOptions);
        return res.status(200).json({ message: "Logged in successfully" });

    } catch (e) {
        logger.error({ err: e }, "Login error");
        return res.status(500).json({ message: "Something went wrong. Please try again." })
    }
}

// httpOnly cookies can't be cleared by frontend JS — the server has to do it.
const logout = (req, res) => {
    res.clearCookie("token", clearAuthCookieOptions);
    return res.status(200).json({ message: "Logged out successfully" });
}


const register = async (req, res) => {
    const { name, username, email, password } = req.body;

    if (
        typeof name !== "string" || typeof username !== "string" ||
        typeof email !== "string" || typeof password !== "string"
    ) {
        return res.status(400).json({ message: "Invalid input" });
    }

    try {
        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const existingEmail = await User.findOne({ email });

        if (existingEmail) {
            return res.status(httpStatus.CONFLICT).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            email: email,
            password: hashedPassword
        });

        await newUser.save();

        // 🔥 create verification token
        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // const verifyLink = `${window.location.origin}/verify/${token}`;

        // 🔥 send email
        await sendVerificationEmail(email, token);

        res.status(201).json({ message: "Verification email sent" });

    } catch (e) {
        logger.error({ err: e }, "Register error");
        res.status(500).json({ message: "Something went wrong. Please try again." })
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(400).json({ message: "Invalid token" });
        }

        user.isVerified = true;
        await user.save();

        return res.json({ message: "Email verified successfully" });

    } catch (err) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
};


const getUserHistory = async (req, res) => {

    try {
        // ✅ user comes from JWT middleware
        const userId = req.user._id;

        const meetings = await Meeting.find({ user_id: userId });

        res.json(meetings);

    } catch (e) {
        logger.error({ err: e }, "Get history error");
        res.status(500).json({ message: "Something went wrong. Please try again." });
    }
}

const addToHistory = async (req, res) => {
    const { meeting_code } = req.body;

    if (!meeting_code) {
        return res.status(400).json({ message: "Meeting code required" });
    }

    try {
        // ✅ user comes from JWT middleware
        const userId = req.user._id;

        const newMeeting = new Meeting({
            user_id: userId,
            meetingCode: meeting_code
        })

        await newMeeting.save();

        res.status(201).json({ message: "Added code to history" })
    } catch (e) {
        logger.error({ err: e }, "Add history error");
        res.status(500).json({ message: "Something went wrong. Please try again." });
    }
}

const getMe = async (req, res) => {
    try {
        // user already comes from verifyToken middleware
        const user = req.user;

        res.json({
            id: user._id || user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            isGoogleUser: user.authProvider === "google"
        });
    } catch (e) {
        logger.error({ err: e }, "Get me error");
        res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

const resendVerification = async (req, res) => {
    const { email } = req.body;

    if (typeof email !== "string" || !email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "This email is already verified" });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        await sendVerificationEmail(email, token);

        return res.status(200).json({ message: "Verification email resent" });

    } catch (e) {
        logger.error({ err: e }, "Resend verification error");
        return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (typeof email !== "string" || !email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });

        // always return success even if email not found (security best practice)
        if (!user) {
            return res.status(200).json({ message: "If this email exists, a reset link has been sent" });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        await sendResetPasswordEmail(email, token);

        return res.status(200).json({ message: "If this email exists, a reset link has been sent" });

    } catch (e) {
        logger.error({ err: e }, "Forgot password error");
        return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });

    } catch (e) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
};

const updateProfile = async (req, res) => {
    const { name, username } = req.body;

    if (!name && !username) {
        return res.status(400).json({ message: "Nothing to update" });
    }

    if (
        (name !== undefined && typeof name !== "string") ||
        (username !== undefined && typeof username !== "string")
    ) {
        return res.status(400).json({ message: "Invalid input" });
    }

    try {
        const userId = req.user._id || req.user.id;

        // check if new username is already taken by someone else
        if (username) {
            const existing = await User.findOne({ username });
            if (existing && existing._id.toString() !== userId.toString()) {
                return res.status(409).json({ message: "Username already taken" });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { ...(name && { name }), ...(username && { username }) },
            { new: true }
        );

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                name: updatedUser.name,
                username: updatedUser.username,
                email: updatedUser.email,
            }
        });

    } catch (e) {
        logger.error({ err: e }, "Update profile error");
        return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

const deleteAccount = async (req, res) => {
    const { password } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Google OAuth users don't have a real password
        if (user.authProvider !== "google") {
            if (!password) {
                return res.status(400).json({ message: "Password is required" });
            }
            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ message: "Incorrect password" });
            }
        }

        // delete all meeting history
        await Meeting.deleteMany({ user_id: user._id });

        // delete user
        await User.findByIdAndDelete(req.user._id);

        return res.status(200).json({ message: "Account deleted successfully" });

    } catch (e) {
        logger.error({ err: e }, "Delete account error");
        return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

export { login, logout, register, getUserHistory, addToHistory, getMe, verifyEmail, resendVerification, forgotPassword, resetPassword, updateProfile, deleteAccount };