import mongoose, { Schema, Types, InferSchemaType, model, Model, Document } from 'mongoose';

const organizationSchema = new Schema({
    // Основная информация
    name: { type: String, required: true },
    shortName: { type: String }, // сокращенное название
    description: { type: String },

    // Тип организации
    typeAccount: {
        type: String,
        enum: [

        ],
        required: true
    },
    labels : [
        {
            type:String,
            enum: [
                'hospital',           // больница
                'clinic',            // клиника
                'university',        // университет
                'research_institute', // научно-исследовательский институт
                'medical_center',    // медицинский центр
                'laboratory',        // лабория
                'pharmacy',          // аптека
                'government',        // государственное учреждение
                'private',           // частная организация
                'other'              // другое
            ]
        }
    ],

    // Специализации организации (ссылки на коллекцию specializations)
    specializations: [{
        specializationId: { type: Schema.Types.ObjectId, ref: 'Specializations', required: true },
        name: { type: String, required: true }, // дублируем для быстрого доступа
        isMain: { type: Boolean, default: false }, // является ли основной специализацией
        category: {
            type: String,
            enum: ['medical', 'educational', 'research', 'administrative'],
            required: true
        }
    }],

    // Контактная информация
    contacts: [{
        type: {
            type: String,
            enum: ['phone', 'email', 'website', 'telegram', 'whatsapp', 'fax'],
            required: true
        },
        label: { type: String },
        value: { type: String, required: true },
        isPublic: { type: Boolean, default: true }
    }],

    // Адрес
    address: {
        country: { type: String, required: true },
        region: { type: String, required: true }, // область/край
        city: { type: String, required: true },
        street: { type: String, required: true },
        building: { type: String, required: true },
        floor: { type: String },
        room: { type: String },
        postalCode: { type: String },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },

    // Руководство
    leadership: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        position: { type: String, required: true }, // "Главный врач", "Ректор", "Директор"
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrently: { type: Boolean, default: true }
    }],

    // Отделения/подразделения
    departments: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        head: { type: Schema.Types.ObjectId, ref: 'User' }, // заведующий отделением
        specialization: { type: String },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }],

    // Сотрудники
    staff: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        position: { type: String, required: true },
        department: { type: String }, // id отделения
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrently: { type: Boolean, default: true },
        salary: { type: Number }, // опционально
        workSchedule: { type: String }, // график работы
        permissions: [{
            type: String,
            enum: ['admin', 'moderator', 'editor', 'viewer']
        }]
    }],

    // Научная деятельность
    scientificActivity: {
        researchAreas: [{ type: String }], // области исследований
        publications: [{
            type: Schema.Types.ObjectId,
            ref: 'Post' // ссылки на научные публикации
        }],
        grants: [{
            id: { type: String, required: true },
            title: { type: String, required: true },
            amount: { type: Number },
            currency: { type: String, default: 'RUB' },
            startDate: { type: Date },
            endDate: { type: Date },
            fundingOrganization: { type: String },
            principalInvestigator: { type: Schema.Types.ObjectId, ref: 'User' }
        }],
        conferences: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            date: { type: Date },
            location: { type: String },
            isOrganizer: { type: Boolean, default: false }
        }]
    },

    // Образовательная деятельность (для учебных заведений)
    educationalActivity: {
        programs: [{
            programId: { type: String, required: true },
            specializationId: { type: Schema.Types.ObjectId, ref: 'Specializations' }, // связь со специализацией
            name: { type: String, required: true },
            degree: {
                type: String,
                enum: ['Специалитет', 'Бакалавриат', 'Магистратура', 'Ординатура', 'Аспирантура']
            },
            duration: { type: Number }, // в годах
            isActive: { type: Boolean, default: true }
        }],
        accreditation: [{
            organization: { type: String, required: true },
            validUntil: { type: Date },
            certificateNumber: { type: String }
        }]
    },

    // Медицинская деятельность (для медучреждений)


    // Логотип и изображения
    logo: {
        fileId: { type: Schema.Types.ObjectId, ref: 'File' },
        defaultPath: { type: String }
    },
    images: [{
        fileId: { type: Schema.Types.ObjectId, ref: 'File' },
        category: {
            type: String,
            enum: ['building', 'interior', 'equipment', 'staff', 'other']
        },
        description: { type: String }
    }],

    // Документы
    documents: [{
        file: { type: Schema.Types.ObjectId, ref: 'File', required: true },
        category: {
            type: String,
            enum: ['license', 'certificate', 'charter', 'regulation', 'other'],
            required: true
        },
        name: { type: String, required: true },
        isPublic: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Рейтинг и отзывы
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },

    // Статистика
    stats: {
        staffCount: { type: Number, default: 0 },
        departmentsCount: { type: Number, default: 0 },
        publicationsCount: { type: Number, default: 0 },
        followersCount: { type: Number, default: 0 }
    },

    // Подписчики (пользователи, которые следят за организацией)
    followers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],

    // События и объявления
    events: [{
        type: Schema.Types.ObjectId,
        ref: 'Announcement'
    }],

    // Система верификации
    isVerified: {
        organization: { type: Boolean, default: false },
        medical: { type: Boolean, default: false },
        educational: { type: Boolean, default: false },
        research: { type: Boolean, default: false }
    },

    // Система модерации
    pendingChanges: {
        data: { type: Schema.Types.Mixed },
        globalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'partial']
        },
        submittedAt: { type: Date, default: Date.now },
        moderatorId: { type: Schema.Types.ObjectId, ref: 'User' },
        moderatedAt: { type: Date },
        moderatorComment: { type: String }
    },

    // Система блокировки
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    bannedAt: { type: Date },
    bannedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    // Дополнительные настройки
    settings: {
        isPublic: { type: Boolean, default: true },
        allowApplications: { type: Boolean, default: true }, // разрешить подачу заявок на работу
        allowReviews: { type: Boolean, default: true } // разрешить отзывы
    }
}, {
    timestamps: true
});

// Индексы для оптимизации
organizationSchema.index({ name: 1 });
organizationSchema.index({ type: 1 });
organizationSchema.index({ 'address.city': 1 });
organizationSchema.index({ 'address.region': 1 });
organizationSchema.index({ 'isVerified.organization': 1 });
organizationSchema.index({ 'specializations.specializationId': 1 });
organizationSchema.index({ 'departments.id': 1 });
organizationSchema.index({ 'staff.userId': 1 });

// Типы для TypeScript
export type Organization = InferSchemaType<typeof organizationSchema>;
export type OrganizationDocument = Organization & Document;

// Типы для фронтенда
export type OrganizationType =
    | 'hospital'
    | 'clinic'
    | 'university'
    | 'research_institute'
    | 'medical_center'
    | 'laboratory'
    | 'pharmacy'
    | 'government'
    | 'private'
    | 'other';

export type ContactType = 'phone' | 'email' | 'website' | 'telegram' | 'whatsapp' | 'fax';

export type DegreeType = 'Специалитет' | 'Бакалавриат' | 'Магистратура' | 'Ординатура' | 'Аспирантура';

export interface OrganizationContact {
    type: ContactType;
    label?: string;
    value: string;
    isPublic: boolean;
}

export interface OrganizationAddress {
    country: string;
    region: string;
    city: string;
    street: string;
    building: string;
    floor?: string;
    room?: string;
    postalCode?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export interface Department {
    id: string;
    name: string;
    description?: string;
    head?: string; // userId
    specialization?: string;
    isActive: boolean;
    createdAt: Date;
}

export interface StaffMember {
    userId: string;
    position: string;
    department?: string;
    startDate: Date;
    endDate?: Date;
    isCurrently: boolean;
    salary?: number;
    workSchedule?: string;
    permissions: string[];
}

export interface OrganizationVerification {
    organization: boolean;
    medical: boolean;
    educational: boolean;
    research: boolean;
}

export interface OrganizationStats {
    staffCount: number;
    departmentsCount: number;
    publicationsCount: number;
    followersCount: number;
}

export const OrganizationModel: Model<Organization> = model<Organization>('Organization', organizationSchema);