// models/IndividualProfile.ts
import { model, Schema, Document, Types } from "mongoose";

// ============================================================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ============================================================================

// Типы для научного статуса
export type AcademicDegree = "Кандидат медицинских наук" | "Доктор медицинских наук";
export type AcademicTitle = "Доцент" | "Профессор";
export type AcademicRank = "Член-корреспондент РАН" | "Академик РАН";

export interface ScientificStatus {
    degree: AcademicDegree | null;
    title: AcademicTitle | null;
    rank: AcademicRank | null;
    interests: string[];
}

// Типы для специализаций врача
export type SpecializationMethod = "Ординатура" | "Профессиональная переподготовка";
export type QualificationCategory = "Вторая категория" | "Первая категория" | "Высшая категория";

export interface Specialization {
    id: string;
    name: string;
    method: SpecializationMethod;
    qualificationCategory: QualificationCategory;
}

// Тип для места работы
export interface Work {
    id: string;
    organizationId?: string;
    organizationName: string;
    position: string;
    startDate: string;
    endDate?: string;
    isCurrently: boolean;
}

export interface Contact {
    type: 'phone' | 'telegram' | 'whatsapp' | 'website' | 'email' | 'vk' | 'facebook' | 'twitter' | 'instagram';
    label?: string;
    value: string;
    isPublic: boolean;
}

export interface BaseEducation {
    id: string;
    institution: string;
    specialty: string;
    startDate: string;
    graduationYear: string;
    isCurrently: boolean;
    documentsId?: Types.ObjectId[];
    isVerified: boolean;
}

export interface StudentEducation extends BaseEducation {
    degree: "Специалитет";
}

export interface GeneralEducation extends BaseEducation {
    degree: string;
}

export interface UserVerification {
    user: boolean;
    doctor: boolean;
    student: boolean;
    resident: boolean;
    postgraduate: boolean;
    researcher: boolean;
}

export interface UserStats {
    followingCount: number;
    followersCount: number;
    postsCount: number;
}

export interface JoinEvent {
    eventId: Types.ObjectId;
    roleEvent: 'participant' | 'speaker' | 'organizer';
    status: 'pending' | 'confirmed' | 'declined';
    registeredAt: Date;
    confirmedAt?: Date;
}

export type ProfessionalRole = 'student' | 'doctor' | 'resident' | 'postgraduate' | 'researcher';

// ============================================================================
// MONGOOSE ДОКУМЕНТ ИНТЕРФЕЙС (с правильными типами)
// ============================================================================

export interface IIndividualProfile extends Document {
    userId: Types.ObjectId;
    firstName: string;
    middleName?: string;
    lastName: string;
    birthday: Date;
    location: string;
    bio?: string;
    professionalRole: ProfessionalRole;
    mainSpecialization?: string;
    experience?: string;
    rating: number;
    placeWork?: string;
    placeStudy?: string;
    workHistory: Work[];
    contacts: Contact[];
    education: StudentEducation | GeneralEducation[];
    specializations?: Specialization[];
    scientificStatus?: ScientificStatus;
    following: Types.ObjectId[];
    followers: Types.ObjectId[];
    stats: UserStats;
    joinTo: JoinEvent[];
    verificationStatus: UserVerification;

    // Виртуальные поля
    fullName: string;
    isVerified: boolean;
    currentWork?: Work;

    // Методы экземпляра
    addWorkHistory(work: Work): Promise<IIndividualProfile>;
    updateVerificationStatus(field: keyof UserVerification, status: boolean): Promise<IIndividualProfile>;
    follow(userIdToFollow: string): Promise<IIndividualProfile>;
    unfollow(userIdToUnfollow: string): Promise<IIndividualProfile>;
}

// ============================================================================
// MONGOOSE СХЕМЫ (упрощенные)
// ============================================================================

const scientificStatusSchema = new Schema({
    degree: {
        type: String,
        enum: ["Кандидат медицинских наук", "Доктор медицинских наук", null],
        default: null
    },
    title: {
        type: String,
        enum: ["Доцент", "Профессор", null],
        default: null
    },
    rank: {
        type: String,
        enum: ["Член-корреспондент РАН", "Академик РАН", null],
        default: null
    },
    interests: [String]
}, { _id: false });

const specializationSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    method: {
        type: String,
        enum: ["Ординатура", "Профессиональная переподготовка"],
        required: true
    },
    qualificationCategory: {
        type: String,
        enum: ["Вторая категория", "Первая категория", "Высшая категория"],
        required: true
    }
}, { _id: false });

const workHistorySchema = new Schema({
    id: { type: String, required: true },
    organizationId: String,
    organizationName: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: String,
    isCurrently: { type: Boolean, default: false }
}, { _id: false });

const contactSchema = new Schema({
    type: {
        type: String,
        enum: ['phone', 'telegram', 'whatsapp', 'website', 'email', 'vk', 'facebook', 'twitter', 'instagram'],
        required: true
    },
    label: String,
    value: { type: String, required: true },
    isPublic: { type: Boolean, default: true }
}, { _id: false });

const userStatsSchema = new Schema({
    followingCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 }
}, { _id: false });

const verificationStatusSchema = new Schema({
    user: { type: Boolean, default: false },
    doctor: { type: Boolean, default: false },
    student: { type: Boolean, default: false },
    resident: { type: Boolean, default: false },
    postgraduate: { type: Boolean, default: false },
    researcher: { type: Boolean, default: false }
}, { _id: false });

const joinEventSchema = new Schema({
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
    confirmedAt: Date
}, { _id: false });

// ============================================================================
// ОСНОВНАЯ СХЕМА
// ============================================================================

const individualProfileSchema = new Schema<IIndividualProfile>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'BaseUser',
        required: true,
        unique: true
    },

    // Личная информация
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    middleName: { type: String, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    birthday: { type: Date, required: true },
    location: { type: String, required: true, trim: true, maxlength: 100 },
    bio: { type: String, trim: true, maxlength: 1000 },

    // Профессиональная роль
    professionalRole: {
        type: String,
        enum: ['student', 'doctor', 'resident', 'postgraduate', 'researcher'],
        required: true
    },

    // Профессиональные данные
    mainSpecialization: { type: String, trim: true, maxlength: 100 },
    experience: { type: String, trim: true, maxlength: 20 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    placeWork: { type: String, trim: true, maxlength: 200 },
    placeStudy: { type: String, trim: true, maxlength: 200 },

    // Массивы
    workHistory: { type: [workHistorySchema], default: [] },
    contacts: { type: [contactSchema], default: [] },

    // Образование (Schema.Types.Mixed для гибкости)
    education: {
        type: Schema.Types.Mixed,
        required: true
    },

    // Условные поля
    specializations: [specializationSchema],
    scientificStatus: scientificStatusSchema,

    // Социальные связи
    following: [{ type: Schema.Types.ObjectId, ref: 'BaseUser' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'BaseUser' }],

    // Счетчики и статусы
    stats: { type: userStatsSchema, default: () => ({}) },
    joinTo: { type: [joinEventSchema], default: [] },
    verificationStatus: { type: verificationStatusSchema, default: () => ({}) }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================================================
// ИНДЕКСЫ
// ============================================================================

individualProfileSchema.index({ userId: 1 });
individualProfileSchema.index({ professionalRole: 1 });
individualProfileSchema.index({ mainSpecialization: 1 });
individualProfileSchema.index({ firstName: 1, lastName: 1 });

// ============================================================================
// ВИРТУАЛЬНЫЕ ПОЛЯ
// ============================================================================

individualProfileSchema.virtual('fullName').get(function(this: IIndividualProfile) {
    const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
    return parts.join(' ');
});

individualProfileSchema.virtual('isVerified').get(function(this: IIndividualProfile) {
    return this.verificationStatus?.user || false;
});

individualProfileSchema.virtual('currentWork').get(function(this: IIndividualProfile) {
    return this.workHistory?.find(work => work.isCurrently);
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

individualProfileSchema.pre('save', function(this: IIndividualProfile, next) {
    // Обновляем счетчики
    if (this.stats) {
        this.stats.followingCount = this.following?.length || 0;
        this.stats.followersCount = this.followers?.length || 0;
    }

    // Базовая валидация образования
    if (this.professionalRole === 'student' && this.education) {
        const edu = this.education as any;
        if (!edu.degree || edu.degree !== "Специалитет") {
            return next(new Error('Студенты должны иметь образование "Специалитет"'));
        }
    }

    next();
});

// ============================================================================
// МЕТОДЫ ЭКЗЕМПЛЯРА
// ============================================================================

individualProfileSchema.methods.addWorkHistory = function(this: IIndividualProfile, work: Work) {
    if (work.isCurrently) {
        this.workHistory.forEach(w => w.isCurrently = false);
    }
    this.workHistory.push(work);
    return this.save();
};

individualProfileSchema.methods.updateVerificationStatus = function(
    this: IIndividualProfile,
    field: keyof UserVerification,
    status: boolean
) {
    if (this.verificationStatus) {
        this.verificationStatus[field] = status;
    }
    return this.save();
};

individualProfileSchema.methods.follow = function(this: IIndividualProfile, userIdToFollow: string) {
    const objectId = new Types.ObjectId(userIdToFollow);
    if (!this.following.some(id => id.equals(objectId))) {
        this.following.push(objectId);
        if (this.stats) {
            this.stats.followingCount = this.following.length;
        }
    }
    return this.save();
};

individualProfileSchema.methods.unfollow = function(this: IIndividualProfile, userIdToUnfollow: string) {
    this.following = this.following.filter(id => !id.equals(new Types.ObjectId(userIdToUnfollow)));
    if (this.stats) {
        this.stats.followingCount = this.following.length;
    }
    return this.save();
};

// ============================================================================
// СТАТИЧЕСКИЕ МЕТОДЫ
// ============================================================================

individualProfileSchema.statics.findByRole = function(role: ProfessionalRole) {
    return this.find({ professionalRole: role });
};

individualProfileSchema.statics.findBySpecialization = function(specialization: string) {
    return this.find({
        mainSpecialization: { $regex: specialization, $options: 'i' }
    });
};

// ============================================================================
// МОДЕЛЬ
// ============================================================================

export const IndividualProfileModel = model<IIndividualProfile>('IndividualProfile', individualProfileSchema);