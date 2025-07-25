import mongoose, { Schema, Types, InferSchemaType, model, Model, Document } from 'mongoose';
import { FileModel } from '@/models/File/File'; // ← ПРОВЕРЬ, есть ли эта строчка?

const userSchema = new Schema({
    firstName: { type: String, required: true },
    middleName: { type: String},
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
        enum: ['student', 'admin', 'doctor',"owner",],

    },
    placeWork: { type: String },
    defaultAvatarPath: { type: String,required: true },
    avatarId: {
        type: Schema.Types.ObjectId,
        ref: 'File'
    },
    contacts: [{
        type: {
            type: String,
            enum: ['phone', 'telegram', 'whatsapp', 'website', 'email',"vk","facebook","twitter","instagram"],
            required: true
        },
        label:{type:String},
        value: { type: String, required: true },
        isPublic: { type: Boolean, default: true }
    }],
    documents: [{
        file: { type: Schema.Types.ObjectId, ref: 'File', required: true },
        category: {
            type: String,
            enum: ['diploma', 'certificate', 'license', 'id', 'other'],
            required: true
        },
        label: { type: String },
        isPublic: { type: Boolean, default: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    education: [{
        institution: { type: String, required: true }, // "Первый МГМУ им. И.М. Сеченова"
        degree: { type: String }, // "Специалитет", "Ординатура"
        startDate: { type: String, required: true },
        specialty: { type: String }, // "Лечебное дело"
        graduationYear: { type: Number },
        isCurrently: { type: Boolean, default: false },
        documentsId: [{ type: Schema.Types.ObjectId, ref: 'File' }],
        customId: { type: String, unique: true },
        isVerified: { type: Boolean, default: false }
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
            type: Schema.Types.Mixed
        }, // Гибкая структура для хранения: { fieldName: { value: any, status: "pending"|"approved"|"rejected" } }
        globalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'partial'], // добавили 'partial' для случаев когда одни поля одобрены, другие - нет

        },
        submittedAt: { type: Date, default: Date.now },
        moderatorId: { type: Schema.Types.ObjectId, ref: 'User' },
        moderatedAt: { type: Date },
        moderatorComment: { type: String },
        isVerified: { type: Boolean, default: false }
    },

    isVerified: {
        user: { type: Boolean, default: false },
        doctor: { type: Boolean, default: false },
        student: { type: Boolean, default: false },

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

export type UserDocument = User & Document;

// Типы для новой структуры pendingChanges
export interface PendingChangeField {
    value: any;
    status: 'pending' | 'approved' | 'rejected';
}

export interface PendingChangesData {
    [fieldName: string]: PendingChangeField;
}

export const UserModel: Model<User> = model<User>('User', userSchema);