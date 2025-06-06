export interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthday: Date;
    roles: string;
    placeWork?: string;

}