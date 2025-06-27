export interface RegisterDto {
    email: string;
    avatar: string;
    password: string;
    firstName: string;
    lastName: string;
    location: string;
    experience: string;
    birthday: Date;
    roles: string;
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