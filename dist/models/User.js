"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
// создаём схему
const userSchema = new mongoose_1.Schema({
    id: { type: String, unique: true }, // Add the id field that AuthService expects
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthday: { type: Date, required: true },
    placeWork: { type: String },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin', 'user', 'doc'],
        default: 'user',
    },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    posts: [{
            type: mongoose_1.Types.ObjectId,
            ref: 'Post',
            required: function () {
                return this.role !== 'user';
            }
        }]
});
// ВАЖНО: вот тут 👇 указываем generic <User>
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
