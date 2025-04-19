export interface User{
    id:string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    birthday: Date;
    createdAt: Date;
    role?: "student" | "teacher" | "admin"; // для авторизации позже

}