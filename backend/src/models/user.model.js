import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function () { return this.authProvider === "local"; }
    },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;