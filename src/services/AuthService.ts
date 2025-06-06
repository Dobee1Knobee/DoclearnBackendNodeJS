import {PublicUser, User, UserModel} from "@/models/User/User";
import {RegisterDto} from "@/dto/RegisterDto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as process from "node:process";
import {EmailService} from "./EmailService";
import {toPublicUser} from "@/utils/toPublicUser";
import {HydratedDocument} from "mongoose";
import {ConflictError} from "@/errors/ConflictError";
import * as crypto from "node:crypto";
import {PasswordResetToken} from "@/models/Password/PasswordResetToken";
import {IncorrectOrExpiredTokenError} from "@/errors/IncorrectOrExpiredToken";

// Временное хранилище кодов подтверждения
const verificationCodes = new Map<string, string>();

export class AuthService {
    async register(dto: RegisterDto): Promise<PublicUser> {
        const existUser = await UserModel.findOne({ email: dto.email }).lean<User>();
        if (existUser) {
            throw new ConflictError("User already exists");
        }

        const hashedPassword = bcrypt.hashSync(dto.password, 10);

        const newUser = await UserModel.create({
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            birthday: dto.birthday,
            role: "student",
            placeWork: dto.placeWork,
            isVerified: false,
        });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes.set(dto.email, code);

        await new EmailService().sendMail(
            dto.email,
            "Код подтверждения аккаунта Doclearn",
            `Ваш код: ${code}`
        );

        return toPublicUser(newUser.toObject());
    }

    async login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
        // Явно указываем тип HydratedDocument<User>
        const user: HydratedDocument<User> | null = await UserModel.findOne({ email }).exec();

        if (!user || !bcrypt.compareSync(password, user.password as string)) {
            throw new Error("Неверный логин или пароль");
        }

        if (!user.isVerified) {
            throw new Error("Пользователь не верифицирован");
        }

        const token = jwt.sign({
            id: user._id.toString(),
            email: user.email as string,
            role: user.role as string
        }, process.env.JWT_SECRET || "megatopsec", { expiresIn: "1d" });

        return {
            token,
            user: toPublicUser(user.toObject())
        };
    }

    async verifyCode(email: string, code: string): Promise<boolean> {
        const saved = verificationCodes.get(email);
        if (saved !== code) return false;

        const user = await UserModel.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        ).exec();

        verificationCodes.delete(email);

        return !!user;
    }

    async createPasswordResetToken(email: string) {
        try {
            const user: HydratedDocument<User> | null = await UserModel.findOne({ email }).exec();
            if (!user) {
                        return //безопасность
                }

            const token = crypto.randomBytes(32).toString("hex");
            const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
            await PasswordResetToken.deleteMany({ userId: user._id });

            // Создаем новый токен
            await PasswordResetToken.create({
                userId: user._id,
                token,
                expiresAt: expires
            });
            const userEmail = user.email as string;

            const resetLink = `https://doclearn.ru/reset-password?token=${token}`;
            await new EmailService().sendMail(userEmail, "Восстановление пароля", `Перейдите по ссылке, чтобы восстановить пароль: ${resetLink}`);
        } catch (error) {
            // Обрабатываем ошибки
            if (error instanceof Error) {
                throw new Error(error.message); // Перебрасываем с конкретным сообщением
            }
            throw new Error("Неизвестная ошибка при восстановлении пароля");
        }


    }
    async validatePasswordResetToken(token:string){
        try {
           const resetToken = await PasswordResetToken.findOne({token}).exec();
           if(!resetToken) return false;
           const isExpired = resetToken.expiresAt < new Date();
           if(isExpired){
               await PasswordResetToken.deleteOne({token});
               return false;
           }
           return true;
        }catch(err){
            throw new Error("Ошибка при проверке токена")
        }
    }

    async resetPasswordResetToken(token:string,newPassword:string):Promise<void> {
        try {
            if(!newPassword || newPassword.length < 8) {
                throw new Error("Пароль должен содержать минимум 8 символов")
            }
            const restToken = await PasswordResetToken.findOne({token}).exec();
            if(!restToken ) {
                throw new IncorrectOrExpiredTokenError("Некоректный или истекший токен")
            }
            if(restToken.expiresAt < new Date()){
                await PasswordResetToken.deleteOne({token});
                throw  new Error("Токен истек")
            }
            const user = await UserModel.findById(restToken.userId).exec();
            if(!user) {
                await PasswordResetToken.deleteOne({token});
                throw new Error("Пользователь не найден")
            }
            user.password = bcrypt.hashSync(newPassword, 12);
            await user.save();
            await PasswordResetToken.deleteMany({userId:restToken.userId});
        }catch(err){
            if (err instanceof Error) {
                throw err;
            }
            throw new Error("Неизвестная ошибка при сбросе пароля");

        }
    }


}

