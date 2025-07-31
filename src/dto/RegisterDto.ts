export interface RegisterDto {
    email: string;
    avatar?: string;
    defaultAvatarPath: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string,
    birthday: Date;
    role: string;
    placeStudy:string;
    placeWork?: string;
}