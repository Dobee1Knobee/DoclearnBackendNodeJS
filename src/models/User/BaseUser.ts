// models/BaseUser.ts
import {model, Schema} from "mongoose";

const baseUserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Тип пользователя
    accountType: {
        type: String,
        enum: ['individual', 'organization'],
        required: true
    },

    // Базовая информация
    defaultAvatarPath: { type: String, required: true },
    avatarId: { type: Schema.Types.ObjectId, ref: 'File' },

    // Системные поля
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    bannedAt: { type: Date },
    bannedBy: { type: Schema.Types.ObjectId, ref: 'BaseUser' },

    warnings: [{
        message: { type: String, required: true },
        issuedBy: { type: Schema.Types.ObjectId, ref: 'BaseUser', required: true },
        issuedAt: { type: Date, default: Date.now },
        reason: { type: String }
    }],

    // Базовая верификация
    isEmailVerified: { type: Boolean, default: false },

}, { timestamps: true });

export const BaseUserModel = model('BaseUser', baseUserSchema);