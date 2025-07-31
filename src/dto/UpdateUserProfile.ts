export interface UpdateUserProfileDto {
    // Основная информация
    firstName?: string;
    role?: string;
    middleName?: string;
    lastName?: string;
    birthday?: string;
    defaultAvatarPath?: string;
    avatarId?: string;
    location?: string;
    experience?: string;
    bio?: string;
    placeWork?: string;
    placeStudy?: string;
    avatar?: string;

    // Контакты
    contacts?: Array<{
        type: 'phone' | 'telegram' | 'whatsapp' | 'website' | 'email' | 'vk' | 'facebook' | 'twitter' | 'instagram';
        value: string;
        isPublic: boolean;
    }>;

    // История работы
    workHistory?: Array<{
        id: string;
        organizationId?: string;
        organizationName: string;
        position: string;
        startDate: string;
        endDate?: string;
        isCurrently: boolean;
    }>;

    // Специализации (приведено в соответствие с вашим DTO)
    specializations?: Array<{
        specializationId: string;
        method: {
            type: string;
            enum: string;
        };
        qualificationCategory?: 'Вторая категория' | 'Первая категория' | 'Высшая категория';
        main?: boolean;
    }>;

    // Научный статус
    scientificStatus?: {
        degree?: 'Кандидат медицинских наук' | 'Доктор медицинских наук' | null;
        title?: 'Доцент' | 'Профессор' | null;
        rank?: 'Член-корреспондент РАН' | 'Академик РАН' | null;
        interests?: string[];
    };

    // Образование
    education?: Array<{
        institution: string;
        degree?: string;
        specialty?: string;
        startDate?: string;
        graduationYear?: number;
        isCurrently: boolean;
        documentsId?: string[];
        customId?: string;
        isVerified?: boolean;
    }>;

    // Достижения
    achievements?: Array<any>;

    // Публикации
    publications?: string[];

    // Дополнительные поля для загрузки образования
    educationForUpload?: any;
}
