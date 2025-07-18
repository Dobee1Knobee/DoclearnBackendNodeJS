export interface UserDto {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    documents: Array<{
        file:string,
        category:{
            type:string
        }
        label?:string
        isPublic:boolean
    }>;
    defaultAvatarPath: string;
    location?: string;
    experience?: string;
    rating: number;
    bio?: string;
    email: string;
    birthday: Date;
    placeWork?: string;
    specialization?: string;
    avatarId?: string ;
    avatarUrl?: string | null;
    contacts: Array<{
        type: 'phone' | 'telegram' | 'whatsapp' | 'website' | 'email' | "vk" |"facebook" | "twitter" | "instagram";
        value: string;
        isPublic: boolean;
    }>;
    education: Array<{
        institution: string;
        degree?: string;
        specialty?: string;
        graduationYear?: number;
        isCurrently: boolean;
    }>;
    role: 'student' | 'admin' | 'user' | 'doctor'; // исправили енум
    following: string[];
    followers: string[];
    joinTo: Array<{
        eventId: string;
        role: 'participant' | 'speaker' | 'organizer';
        status: 'pending' | 'confirmed' | 'declined';
        registeredAt: Date;
        confirmedAt?: Date;
    }>;
    stats: {
        followingCount: number;
        followersCount: number;
        postsCount: number;
    };
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    isFollowing?: boolean; // опциональное поле для UI
}