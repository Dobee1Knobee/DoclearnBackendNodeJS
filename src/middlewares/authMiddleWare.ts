import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "@/models/User/User";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // 1️⃣ Читаем токен из cookie
        const token = req.cookies.token;

        if (!token) {
            res.status(401).json({
                success: false,
                error: "Токен не найден",
                code: "MISSING_TOKEN"
            });
            return;
        }

        // 2️⃣ Проверяем JWT_SECRET
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("❌ JWT_SECRET не установлен!");
            res.status(500).json({
                success: false,
                error: "Ошибка конфигурации сервера"
            });
            return;
        }

        // 3️⃣ Проверяем и декодируем токен
        const decoded = jwt.verify(token, jwtSecret) as any;

        // 4️⃣ Валидируем payload
        if (!decoded.id || !decoded.email) {
            res.status(401).json({
                success: false,
                error: "Некорректный токен"
            });
            return;
        }

        // 5️⃣ Добавляем пользователя в request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || 'user'
        };

        next();

    } catch (jwtError: any) {
        // 6️⃣ Обработка JWT ошибок
        console.error("JWT Error:", jwtError.message);

        const errorMessage = jwtError.name === 'TokenExpiredError'
            ? "Токен истёк"
            : "Недействительный токен";

        res.status(401).json({
            success: false,
            error: errorMessage
        });
    }
};

export const adminMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Проверяем что пользователь авторизован
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Пользователь не авторизован",
                code: "NOT_AUTHENTICATED"
            });
            return;
        }

        // Проверяем роль администратора или владельца
        if (!['admin', 'owner'].includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: "Недостаточно прав доступа",
                code: "INSUFFICIENT_PERMISSIONS"
            });
            return;
        }

        // Дополнительная проверка - не забанен ли админ
        const adminUser = await UserModel.findById(req.user.id);
        if (adminUser?.isBanned) {
            res.status(403).json({
                success: false,
                error: "Аккаунт администратора заблокирован"
            });
            return;
        }

        next();

    } catch (error) {
        console.error("Admin middleware error:", error);
        res.status(500).json({
            success: false,
            error: "Ошибка проверки прав доступа"
        });
    }
};

export const banCheckMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Проверяем что пользователь авторизован
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Пользователь не авторизован",
                code: "NOT_AUTHENTICATED"
            });
            return;
        }

        // Проверяем забанен ли пользователь
        const user = await UserModel.findById(req.user.id).select('isBanned banReason bannedAt').lean();

        if (user?.isBanned) {
            res.status(403).json({
                success: false,
                error: "Ваш аккаунт заблокирован",
                code: "USER_BANNED",
                details: {
                    reason: user.banReason,
                    bannedAt: user.bannedAt
                }
            });
            return;
        }

        next();

    } catch (error) {
        console.error("Ban check middleware error:", error);
        res.status(500).json({
            success: false,
            error: "Ошибка проверки статуса аккаунта"
        });
    }
};
