import mongoose, { Schema, Types, InferSchemaType, model, Model, Document } from 'mongoose';

// создаём схему
const userSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    location: { type: String, required: true },
    experience: { type: String},
    specialization: { type: String }, // добавили специализацию
    rating: { type: Number, default: 0 },
    bio: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthday: { type: Date, required: true },
    role: {
        type: String,
        enum: ['student', 'admin', 'user', 'doctor'],
        default: 'user',
    },
    placeWork: { type: String },
    avatar: { type: String },
    contacts: [{
        type: {
            type: String,
            enum: ['phone', 'telegram', 'whatsapp', 'linkedin', 'email'],
            required: true
        },
        value: { type: String, required: true },
        isPublic: { type: Boolean, default: true }
    }],
    education: [{
        institution: { type: String, required: true }, // "Первый МГМУ им. И.М. Сеченова"
        degree: { type: String }, // "Специалитет", "Ординатура"
        specialty: { type: String }, // "Лечебное дело"
        graduationYear: { type: Number },
        isCurrently: { type: Boolean, default: false }
    }],

    following: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],

    // Кто читает меня (подписчики)
    followers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    joinTo: [{
        eventId: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true }, // вернули eventId
        roleEvent: {
            type: String,
            enum: ['participant', 'speaker', 'organizer'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'declined'],
            default: 'pending'
        },
        registeredAt: { type: Date, default: Date.now },
        confirmedAt: { type: Date }
    }],
    // Счётчики для UI (кешированные)
    stats: {
        followingCount: { type: Number, default: 0 },
        followersCount: { type: Number, default: 0 },
        postsCount: { type: Number, default: 0 }
    },

    // Система модерации изменений профиля
    pendingChanges: {
        data: {
            firstName: { type: String },
            lastName: { type: String },
            location: { type: String },
            experience: { type: String },
            bio: { type: String },
            placeWork: { type: String },
            specialization: { type: String },
            avatar: { type: String },
            contacts: [{
                type: {
                    type: String,
                    enum: ['phone', 'telegram', 'whatsapp', 'website', 'email', 'vk', 'facebook', 'twitter', 'instagram']
                },
                value: { type: String },
                isPublic: { type: Boolean }
            }],
            education: [{
                institution: { type: String },
                degree: { type: String },
                specialty: { type: String },
                graduationYear: { type: Number },
                isCurrently: { type: Boolean }
            }]
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        submittedAt: { type: Date, default: Date.now },
        moderatorId: { type: Schema.Types.ObjectId, ref: 'User' },
        moderatedAt: { type: Date },
        moderatorComment: { type: String }
    },

    isVerified: {
        user: { type: Boolean, default: false },
        doctor: { type: Boolean, default: false }
    },

    // Система админки и модерации
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    bannedAt: { type: Date },
    bannedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    warnings: [{
        message: { type: String, required: true },
        issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        issuedAt: { type: Date, default: Date.now },
        reason: { type: String }
    }]
}, {
    timestamps: true // автоматические createdAt/updatedAt
});

// выводим тип из схемы
export type User = InferSchemaType<typeof userSchema>;
export type PublicUser = Omit<User, 'password'>;

// Type for MongoDB document (includes _id and other Mongoose methods)
export type UserDocument = User & Document;

// ВАЖНО: вот тут 👇 указываем generic <User>
export const UserModel: Model<User> = model<User>('User', userSchema);