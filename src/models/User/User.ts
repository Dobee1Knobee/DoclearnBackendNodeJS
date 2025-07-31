import mongoose, { Schema, Types, InferSchemaType, model, Model, Document } from 'mongoose';
import { FileModel } from '@/models/File/File';
// ✅ Импортируем модель специализаций
import { SpecializationModel } from '../Specializations';

const userSchema = new Schema({
    firstName: { type: String, required: true },
    middleName: { type: String},
    lastName: { type: String, required: true },
    location: { type: String },
    experience: { type: String},
    rating: { type: Number, default: 0 },
    bio: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthday: { type: Date, required: true },
    role: {
        type: String,
        enum: ['student', 'admin', 'doctor', 'owner', 'resident', 'postgraduate', 'researcher'],
    },
    workHistory: [{
        id: { type: String, required: true },
        organizationId: { type: String },
        organizationName: { type: String, required: true },
        position: { type: String, required: true },
        startDate: { type: String, required: true },
        endDate: { type: String },
        isCurrently: { type: Boolean, default: false }
    }],
    placeWork: { type: String },
    placeStudy: { type: String },

    // ОБНОВЛЕННЫЕ специализации врача
    specializations: [{
        _id: false,
        specializationId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Specializations'
        },
        name: { type: String },
        method: {
            type: String,
            enum: ['Ординатура', 'Профессиональная переподготовка'],
            required: true
        },
        qualificationCategory: {
            type: String,
            enum: ['Вторая категория', 'Первая категория', 'Высшая категория'],
            required: true
        },
        main: { type: Boolean, required: true }
    }],

    // Остальные поля остаются без изменений...
    scientificStatus: {
        degree: {
            type: String,
            enum: ['Кандидат медицинских наук', 'Доктор медицинских наук'],
            default: null
        },
        title: {
            type: String,
            enum: ['Доцент', 'Профессор'],
            default: null
        },
        rank: {
            type: String,
            enum: ['Член-корреспондент РАН', 'Академик РАН'],
            default: null
        },
        interests: [{ type: String }]
    },
    achievements: [{
        type: Schema.Types.Mixed
    }],
    publications: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
    defaultAvatarPath: { type: String, required: true },
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
        label: { type: String },
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
        institution: { type: String, required: true },
        degree: { type: String },
        startDate: { type: String, required: true },
        specialty: { type: String },
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
    followers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    joinTo: [{
        eventId: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true },
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
    stats: {
        followingCount: { type: Number, default: 0 },
        followersCount: { type: Number, default: 0 },
        postsCount: { type: Number, default: 0 }
    },
    pendingChanges: {
        data: {
            type: Schema.Types.Mixed
        },
        globalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'partial'],
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
        resident: { type: Boolean, default: false },
        postgraduate: { type: Boolean, default: false },
        researcher: { type: Boolean, default: false },
    },
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
    timestamps: true
});

// ✅ Middleware для автоматического заполнения name из Specializations
userSchema.pre('save', async function(next) {
    if (this.specializations && this.specializations.length > 0) {
        for (let spec of this.specializations) {
            if (spec.specializationId && !spec.name) {
                try {
                    const specialization = await SpecializationModel.findById(spec.specializationId);
                    if (specialization && specialization.label) {
                        spec.name = specialization.label;
                    }
                } catch (error) {
                    console.error('Error fetching specialization:', error);
                }
            }
        }
    }
    next();
});

// ✅ Middleware для findOneAndUpdate
userSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate() as any;

    const specializations = update?.specializations ||
        update?.$set?.specializations ||
        update?.$push?.specializations;

    if (specializations) {
        if (Array.isArray(specializations)) {
            for (let spec of specializations) {
                if (spec.specializationId && !spec.name) {
                    try {
                        const specialization = await SpecializationModel.findById(spec.specializationId);
                        if (specialization && specialization.label) {
                            spec.name = specialization.label;
                        }
                    } catch (error) {
                        console.error('Error fetching specialization:', error);
                    }
                }
            }
        } else if (specializations.specializationId && !specializations.name) {
            try {
                const specialization = await SpecializationModel.findById(specializations.specializationId);
                if (specialization && specialization.label) {
                    specializations.name = specialization.label;
                }
            } catch (error) {
                console.error('Error fetching specialization:', error);
            }
        }
    }
    next();
});

// ✅ Middleware для updateOne
userSchema.pre('updateOne', async function(next) {
    const update = this.getUpdate() as any;

    const specializations = update?.specializations ||
        update?.$set?.specializations ||
        update?.$push?.specializations;

    if (specializations) {
        if (Array.isArray(specializations)) {
            for (let spec of specializations) {
                if (spec.specializationId && !spec.name) {
                    try {
                        const specialization = await SpecializationModel.findById(spec.specializationId);
                        if (specialization && specialization.label) {
                            spec.name = specialization.label;
                        }
                    } catch (error) {
                        console.error('Error fetching specialization:', error);
                    }
                }
            }
        } else if (specializations.specializationId && !specializations.name) {
            try {
                const specialization = await SpecializationModel.findById(specializations.specializationId);
                if (specialization && specialization.label) {
                    specializations.name = specialization.label;
                }
            } catch (error) {
                console.error('Error fetching specialization:', error);
            }
        }
    }
    next();
});

// Индексы для оптимизации
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'isVerified.user': 1 });
userSchema.index({ 'education.id': 1 });
userSchema.index({ 'specializations.specializationId': 1 });
userSchema.index({ 'workHistory.id': 1 });

// Типы
export type User = InferSchemaType<typeof userSchema>;
export type PublicUser = Omit<User, 'password'>;
export type UserDocument = User & Document;

export interface PendingChangeField {
    value: any;
    status: 'pending' | 'approved' | 'rejected';
}

export interface PendingChangesData {
    [fieldName: string]: PendingChangeField;
}

export type AcademicDegree = "Кандидат медицинских наук" | "Доктор медицинских наук";
export type AcademicTitle = "Доцент" | "Профессор";
export type AcademicRank = "Член-корреспондент РАН" | "Академик РАН";
export type SpecializationMethod = "Ординатура" | "Профессиональная переподготовка";
export type QualificationCategory = "Вторая категория" | "Первая категория" | "Высшая категория";

export interface ScientificStatus {
    degree: AcademicDegree | null;
    title: AcademicTitle | null;
    rank: AcademicRank | null;
    interests: string[];
}

export interface Specialization {
    specializationId: string;
    name: string;
    method: SpecializationMethod;
    qualificationCategory: QualificationCategory;
    main: boolean;
}

export const UserModel: Model<User> = model<User>('User', userSchema);