import mongoose, { Schema, Types, InferSchemaType, model, Model, Document } from 'mongoose';

// создаём схему
const userSchema = new Schema({
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    birthday:  { type: Date, required: true },
    placeWork: { type: String },
    role:      {
        type: String,
        enum: ['student', 'teacher', 'admin', 'user', 'doc'],
        default: 'user',
    },
    following: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],

    // Кто читает меня (подписчики)
    followers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],

    // Счётчики для UI (кешированные)
    stats: {
        followingCount: { type: Number, default: 0 },
        followersCount: { type: Number, default: 0 },
        postsCount: { type: Number, default: 0 }
    },
    isVerified: { type: Boolean, default: false },
    createdAt:  { type: Date, default: Date.now }
});

// выводим тип из схемы
export type User = InferSchemaType<typeof userSchema>;
export type PublicUser = Omit<User, 'password'>;

// Type for MongoDB document (includes _id and other Mongoose methods)
export type UserDocument = User & Document;

// ВАЖНО: вот тут 👇 указываем generic <User>
export const UserModel: Model<User> = model<User>('User', userSchema);
