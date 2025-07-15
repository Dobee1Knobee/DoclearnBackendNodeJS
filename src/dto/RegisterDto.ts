export interface RegisterDto {
    email: string;
    avatar?: string;
    defaultAvatarPath: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string,

    location?: string;
    experience?: string;
    birthday: Date;
    role: string;
    contacts?: Array<{
        type:string,
        label:string,
        value:string,
        isPublic:false
    }>;
    education?: Array<{
        institution: string;
        degree?: string;
        specialty?: string;
        graduationYear?: number;
        isCurrently?: boolean;
    }>;
    placeWork?: string;
    specialization?: string;
}