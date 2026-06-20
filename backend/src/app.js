import "dotenv/config";
import passport from "./config/passport.js";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import userRoutes from "./routes/users.routes.js";
import { Meeting } from "./models/meeting.model.js";
import logger from "./utils/logger.js";

// Catch anything that slips past every try/catch in the app (a truly
// unexpected error). Without these, an unhandled rejection or sync
// throw anywhere outside Express's request/response cycle crashes the
// whole process silently — these log it and exit so Render can restart
// the service cleanly instead of leaving it stuck in a broken state.
process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled promise rejection");
    process.exit(1);
});

process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception");
    process.exit(1);
});

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000))
app.use(helmet());
app.use(cors({
    origin: ["https://callify-connect.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/api/v1/users", userRoutes);

// Final safety net: catches anything an async route handler throws that
// wasn't already handled inside its own try/catch (Express 5 auto-forwards
// rejected async handlers here). Always returns a generic message — never
// leaks internal error details to the client.
app.use((err, req, res, next) => {
    logger.error({ err, path: req.path, method: req.method }, "Unhandled request error");
    if (res.headersSent) return next(err);
    res.status(500).json({ message: "Something went wrong. Please try again." });
});

mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
});

mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
});

const start = async () => {
    app.set("mongo_user")

    try {
        const connectionDb = await mongoose.connect(process.env.MONGO_URI);
        logger.info({ host: connectionDb.connection.host }, "MongoDB connected");
    } catch (err) {
        logger.error({ err }, "Failed to connect to MongoDB — exiting");
        process.exit(1);
    }

    server.listen(app.get("port"), () => {
        logger.info({ port: app.get("port") }, "Server listening");
    });

const cleanOldMeetings = async () => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await Meeting.deleteMany({ date: { $lt: oneDayAgo } });
        if (result.deletedCount > 0) {
            logger.info({ deletedCount: result.deletedCount }, "Cleaned old meetings");
        }
    } catch (err) {
        logger.error({ err }, "Meeting cleanup error");
    }
};

cleanOldMeetings();
setInterval(cleanOldMeetings, 60 * 60 * 1000);


}

start().catch((err) => {
    logger.error({ err }, "Fatal error during startup");
    process.exit(1);
});