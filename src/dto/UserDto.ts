import {MedicalTag} from "@/dto/PostDto";

export interface UserDto {
    id: string;  // ← MongoDB всегда возвращает _id
    firstName: string;
    lastName: string;
    email: string;
    birthday: Date;
    placeWork?: string;
    role: 'student' | 'teacher' | 'admin' | 'user' | 'doc';

    // Массивы ObjectId (как строки)
    following: string[];
    followers: string[];

    // Простые числа
    stats: {
        followingCount: number;
        followersCount: number;
        postsCount: number;
    };

    isVerified: boolean;
    createdAt: Date;

    // Дополнительное поле для UI
    isFollowing?: boolean;
}


export interface UpdatePostDto {
    email?: string;
    medicalTags?: MedicalTag[];
    specialty?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    visibility?: 'public' | 'followers_only' | 'private';
}