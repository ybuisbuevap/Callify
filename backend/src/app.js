import "dotenv/config";
import passport from "./config/passport.js";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import { Meeting } from "./models/meeting.model.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000))
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use(passport.initialize());
app.use("/api/v1/users", userRoutes);

const start = async () => {
    app.set("mongo_user")
    const connectionDb = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MONGO Connected DB HOst: ${connectionDb.connection.host}`)
    server.listen(app.get("port"), () => {
        console.log("LISTENIN ON PORT 8000")
    });

const cleanOldMeetings = async () => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await Meeting.deleteMany({ date: { $lt: oneDayAgo } });
        if (result.deletedCount > 0) {
            console.log(`Cleaned ${result.deletedCount} old meetings`);
        }
    } catch (e) {
        console.log("Meeting cleanup error:", e.message);
    }
};

cleanOldMeetings();
setInterval(cleanOldMeetings, 60 * 60 * 1000);    


}

start();