
// Вспомогательные интерфейсы
export interface MedicalTag {
    name: string;
    category: 'symptom' | 'diagnosis' | 'treatment' | 'specialty' | 'other';
}

export interface PostLink {
    url: string;
    title?: string;
    description?: string;
    previewImage?: string;
}

export interface CreatePostDto{
    text:string;
    images?:string[];
    medicalTags?:MedicalTag[];
    speciality?:string[];
    isCase?:boolean;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    visibility?: 'public' | 'followers_only' | 'private' | "docs";
    isAnonymous?: boolean;
    links?: {
        url?: string;
        title?: string;
        description?: string;
        previewImage?: string;
    }[];
}

export interface UpdatePostDto {
    text?: string;
    medicalTags?: MedicalTag[];
    specialty?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    visibility?: 'public' | 'followers_only' | 'private';
}

export interface PostResponseDto {
    id: string;
    content: {
        text: string;
        images: string[];
        links: PostLink[];
    };
    medical: {
        tags: MedicalTag[];
        specialty?: string;
        isCase: boolean;
        difficulty: string;
    };
    author: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        specialty?: string;
        isAnonymous?: boolean; // если пост анонимный, не показываем автора
    };
    stats: {
        likes: number;
        comments: number;
        shares: number;
        views: number;
    };
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
}


// DTO для ленты постов (более легкая версия)
export interface FeedPostDto {
    id: string;
    content: {
        text: string;
        previewImage?: string; // только превью
    };
    author: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
    };
    stats: {
        likes: number;
        comments: number;
        shares: number;
    };
    medical: {
        specialty?: string;
        isCase: boolean;
    };
    createdAt: Date;
}


// DTO для поиска и фильтрации постов
export interface PostFilterDto {
    specialty?: string;
    isCase?: boolean;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    authorRole?: 'student' | 'doctor' | 'professor';
    tags?: string[]; // массив названий тегов
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    skip?: number;
}

export interface PostStatsDto {
    postId: string;
    action: 'like' | 'unlike' | 'view' | 'share';
}
