
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Расширяем интерфейс Request
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
        // 1️⃣ ПРОВЕРЯЕМ НАЛИЧИЕ ЗАГОЛОВКА
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                success: false,
                error: "Токен не предоставлен",
                code: "MISSING_TOKEN"
            });
            return;
        }

        // 2️⃣ ПРОВЕРЯЕМ ФОРМАТ "Bearer TOKEN"
        if (!authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: "Неверный формат токена. Используйте 'Bearer <token>'",
                code: "INVALID_TOKEN_FORMAT"
            });
            return;
        }

        // 3️⃣ ИЗВЛЕКАЕМ ТОКЕН
        const token = authHeader.substring(7); // Убираем "Bearer "

        if (!token.trim()) {
            res.status(401).json({
                success: false,
                error: "Токен пустой",
                code: "EMPTY_TOKEN"
            });
            return;
        }

        // 4️⃣ ПРОВЕРЯЕМ JWT SECRET
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("❌ JWT_SECRET не установлен в environment!");
            res.status(500).json({
                success: false,
                error: "Ошибка конфигурации сервера",
                code: "SERVER_MISCONFIGURATION"
            });
            return;
        }

        // 5️⃣ ПРОВЕРЯЕМ И ДЕКОДИРУЕМ JWT
        try {
            const decoded = jwt.verify(token, jwtSecret) as any;

            // 6️⃣ ВАЛИДИРУЕМ СТРУКТУРУ ТОКЕНА
            if (!decoded.id || !decoded.email) {
                res.status(401).json({
                    success: false,
                    error: "Токен не содержит необходимых данных",
                    code: "INVALID_TOKEN_PAYLOAD"
                });
                return;
            }

            // 7️⃣ ДОБАВЛЯЕМ ПОЛЬЗОВАТЕЛЯ В REQUEST
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role || 'user'
            };

            // 8️⃣ ПЕРЕДАЁМ УПРАВЛЕНИЕ ДАЛЬШЕ
            next();

        } catch (jwtError: any) {
            // 9️⃣ ДЕТАЛЬНАЯ ОБРАБОТКА JWT ОШИБОК
            let errorMessage = "Недействительный токен";
            let errorCode = "INVALID_TOKEN";

            switch (jwtError.name) {
                case 'TokenExpiredError':
                    errorMessage = "Токен истёк";
                    errorCode = "TOKEN_EXPIRED";
                    break;
                case 'JsonWebTokenError':
                    errorMessage = "Неверный формат токена";
                    errorCode = "MALFORMED_TOKEN";
                    break;
                case 'NotBeforeError':
                    errorMessage = "Токен ещё не активен";
                    errorCode = "TOKEN_NOT_ACTIVE";
                    break;
                default:
                    console.error("❌ Неизвестная JWT ошибка:", jwtError);
            }

            res.status(401).json({
                success: false,
                error: errorMessage,
                code: errorCode
            });
            return;
        }

    } catch (error) {
        // 🔟 ОБРАБОТКА НЕОЖИДАННЫХ ОШИБОК
        console.error("❌ Критическая ошибка в authMiddleware:", error);
        res.status(500).json({
            success: false,
            error: "Внутренняя ошибка сервера",
            code: "INTERNAL_SERVER_ERROR"
        });
        return;
    }
};