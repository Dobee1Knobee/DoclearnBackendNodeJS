import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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