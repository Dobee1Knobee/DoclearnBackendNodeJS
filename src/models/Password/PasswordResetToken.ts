// models/PasswordResetToken.ts
import mongoose from "mongoose";

const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
});

export const PasswordResetToken = mongoose.model("PasswordResetToken", schema);
