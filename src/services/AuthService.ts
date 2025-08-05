import {PublicUser, User, UserModel} from "@/models/User/User";
import {RegisterDto} from "@/dto/RegisterDto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as process from "node:process";
import {EmailService} from "./EmailService";
import {mapUserToPublicDto,} from "@/utils/toPublicUser";
import {HydratedDocument} from "mongoose";
import {ConflictError} from "@/errors/ConflictError";
import * as crypto from "node:crypto";
import {PasswordResetToken} from "@/models/Password/PasswordResetToken";
import {IncorrectOrExpiredTokenError} from "@/errors/IncorrectOrExpiredToken";
import {Response} from "express";
import {UserDto} from "@/dto/UserDto";
import {ApiError} from "@/errors/ApiError";
import {IRefreshToken, RefreshTokenModel} from "@/models/Password/RefreshToken";
import {UserService} from "@/services/UserService";

// Временное хранилище кодов подтверждения
const verificationCodes = new Map<string, string>();

export class AuthService {
    private userService: UserService;
    constructor() {
        this.userService = new UserService();
    }
    async register(dto: RegisterDto): Promise<UserDto> {
        const existUser = await UserModel.findOne({ email: dto.email }).lean<User>();

        if (existUser) {
            throw new ConflictError("User already exists");
        }

        const hashedPassword = bcrypt.hashSync(dto.password, 10);

        const newUser = await UserModel.create({
            email: dto.email,
            defaultAvatarPath : dto.defaultAvatarPath,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName,
            avatar: dto.avatar,
            birthday: dto.birthday,
            role: dto.role,
            placeStudy: dto.placeStudy,
            placeWork: dto.placeWork,
            "isVerified.user": false,
            "isVerified.doctor": false,
      });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes.set(dto.email, code);
        console.log(dto.email)
        await new EmailService().sendMail(
            dto.email,
            "Код подтверждения аккаунта Doclearn",
            `Ваш код: ${code}`
        );

        return mapUserToPublicDto(newUser.toObject());
    }
     async createRefreshToken(userId: string): Promise<string> {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней

        await RefreshTokenModel.create({
            userId,
            token,
            expiresAt
        });

        return token;
    }
     async validateRefreshToken(token: string): Promise<string | null> {
        const refreshToken = await RefreshTokenModel.findOne({ token }).exec();

        if (!refreshToken || refreshToken.expiresAt < new Date()) {
            return null;
        }

        return refreshToken.userId.toString();
    }
    async login(email: string, password: string): Promise<{ token: string; user: UserDto,refreshToken:string }> {
        // Явно указываем тип HydratedDocument<User>
        const user: HydratedDocument<User> | null = await UserModel.findOne({ email }).exec();

        if (!user || !bcrypt.compareSync(password, user.password as string)) {
            throw new ApiError(400,"Неверный логин или пароль");
        }

        if (!user.isVerified) {
            throw new Error("Пользователь не верифицирован");
        }
        const userDto = mapUserToPublicDto(user);

        // Добавляем avatar URL
        if (user.avatarId) {
            const avatarUrl = await this.userService.getAvatarUrl(user.avatarId.toString());
            console.log(avatarUrl);
            userDto.avatarUrl = avatarUrl;
        }

        const token = jwt.sign({
            id: user._id.toString(),
            email: user.email as string,
            role: user.role as string
        }, process.env.JWT_SECRET || "megatopsec", { expiresIn: "15min" });

        const refreshToken = await this.createRefreshToken(user._id.toString());

        return {
            token,
            refreshToken,
            user: mapUserToPublicDto(userDto)
        };
    }

    async logout(userId: string): Promise<void> {
        const result = await RefreshTokenModel.deleteMany({ userId });

        // result.deletedCount - количество удаленных документов
        if (result.deletedCount === 0) {
            // Пользователь уже был разлогинен или токенов не было
            console.log("No refresh tokens found for user");
        }
    }

    async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
        const userId = await this.validateRefreshToken(refreshToken);

        if (!userId) {
            throw new Error("Invalid or expired refresh token");
        }

        const user = await UserModel.findById(userId).exec();

        if (!user || !user.isVerified) {
            throw new Error("User not found or not verified");
        }

        const token = jwt.sign({
            id: user._id.toString(),
            email: user.email as string,
            role: user.role as string
        }, process.env.JWT_SECRET || "megatopsec", { expiresIn: "15m" });

        return { token };
    }

    async verifyCode(email: string, code: string): Promise<{ token: string; refreshToken: string; user: UserDto }> {
        const saved = verificationCodes.get(email);
        if (saved !== code) {
            throw new Error("Неверный код подтверждения");
        }

        const user = await UserModel.findOneAndUpdate(
            { email },
            { 'isVerified.user': true },
            { new: true }
        ).exec();

        if (!user) {
            throw new Error("Пользователь не найден");
        }

        const token = jwt.sign({
            id: user._id.toString(),
            email: user.email as string,
            role: user.role as string
        }, process.env.JWT_SECRET || "megatopsec", { expiresIn: "15min" });

        // Добавь эту строку:
        const refreshToken = await this.createRefreshToken(user._id.toString());

        verificationCodes.delete(email);

        return {
            token,
            refreshToken, // ✅ добавили
            user: mapUserToPublicDto(user.toObject())
        };
    }


    async createPasswordResetToken(email: string, res: Response) {
        try {
            const user: HydratedDocument<User> | null = await UserModel.findOne({ email }).exec();
            if (!user) {
                throw new ApiError(400, "Такого пользователя не существует")
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

            // ❌ УДАЛИ ЭТУ СТРОЧКУ:
            // res.cookie("token", token, { maxAge: 15 * 60 * 1000 });

            const userEmail = user.email as string;

            // ✅ ИСПРАВЬ ССЫЛКУ - добавь токен в URL:
            const resetLink = `https://doclearn.ru/reset-password?token=${token}`;

            await new EmailService().sendMail(userEmail, "Восстановление пароля",
                `Перейдите по ссылке, чтобы восстановить пароль: ${resetLink}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error; // прокидываем как есть
            }
            if (error instanceof Error) {
                throw new Error(error.message);
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
    async resetPasswordResetToken(token: string, newPassword: string): Promise<void> {
        try {
            if (!newPassword || newPassword.length < 8) {
                throw new Error("Пароль должен содержать минимум 8 символов");
            }

            const restToken = await PasswordResetToken.findOne({ token }).exec();
            if (!restToken) {
                throw new IncorrectOrExpiredTokenError("Некорректный или истекший токен");
            }

            if (restToken.expiresAt < new Date()) {
                await PasswordResetToken.deleteOne({ token });
                throw new Error("Токен истек");
            }

            const user = await UserModel.findById(restToken.userId).exec();
            if (!user) {
                await PasswordResetToken.deleteOne({ token });
                throw new Error("Пользователь не найден");
            }

            // Обновляем только пароль, минуя валидацию других полей
            await UserModel.findByIdAndUpdate(
                restToken.userId,
                { password: bcrypt.hashSync(newPassword, 12) },
                { runValidators: false } // Отключаем валидацию
            );

            await PasswordResetToken.deleteMany({ userId: restToken.userId });
        } catch (err) {
            if (err instanceof Error) {
                throw err;
            }
            throw new Error("Неизвестная ошибка при сбросе пароля");
        }
    }


}

