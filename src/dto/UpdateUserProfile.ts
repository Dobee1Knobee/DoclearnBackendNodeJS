export interface UpdateUserProfileDto {
    // Основная информация
    firstName?: string;
    birthday?: string;
    avatarId?: string;
    lastName?: string;
    location?: string;
    experience?: string;
    bio?: string;
    placeWork?: string;
    specialization?: string;
    avatar?: string;

    // Контакты
    contacts?: Array<{
        type: 'phone' | 'telegram' | 'whatsapp' | 'website' | 'email' | 'vk' | 'facebook' | 'twitter' | 'instagram';
        value: string;
        isPublic: boolean;
    }>;

    // Образование
    education?: Array<{
        institution: string;
        degree?: string;
        specialty?: string;
        graduationYear?: number;
        isCurrently: boolean;
    }>;
}