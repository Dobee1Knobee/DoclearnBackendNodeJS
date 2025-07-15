import { Request, Response, NextFunction } from "express";
import { AuthService } from "@/services/AuthService";

const authService = new AuthService();

// Функция вне класса для настройки cookies
const getSafariCookieOptions = (req: Request) => {
    const userAgent = req.headers['user-agent'] || '';
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    const isProduction = process.env.NODE_ENV === 'production';

    console.log('🍪 Cookie options for:', {
        isSafari,
        isProduction,
        userAgent: userAgent.substring(0, 50)
    });

    if (isSafari) {
        // Для Safari используем максимально простые настройки
        return {
            httpOnly: true,
            secure: false, // ✅ Убираем secure для Safari (даже на production)
            sameSite: 'lax' as const, // ✅ Только lax для Safari
            path: '/',
            // ✅ НЕ устанавливаем domain для Safari
        };
    }

    // Стандартные настройки для других браузеров
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' as const : 'lax' as const,
        path: '/',
        domain: isProduction ? '.doclearn.ru' : undefined
    };
};

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            res.clearCookie("token");
            res.clearCookie("refreshToken");

            const user = await authService.register(req.body);
            res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            const cookieOptions = getSafariCookieOptions(req);

            console.log('🍪 Setting cookies with options:', cookieOptions);

            // Устанавливаем access token
            res.cookie("token", result.token, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 минут
            });

            // Устанавливаем refresh token
            res.cookie("refreshToken", result.refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
            });

            res.status(200).json({
                success: true,
                user: result.user,
                message: "Успешная авторизация"
            });
        } catch (err) {
            next(err);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.cookies;

            console.log('🔄 Refresh attempt:', {
                hasRefreshToken: !!refreshToken,
                cookies: Object.keys(req.cookies),
                userAgent: req.headers['user-agent']?.substring(0, 50)
            });

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    error: "Refresh token не найден в cookies",
                    code: "MISSING_REFRESH_TOKEN"
                });
            }

            const result = await authService.refreshAccessToken(refreshToken);
            const cookieOptions = getSafariCookieOptions(req);

            console.log('🍪 Refreshing cookies with options:', cookieOptions);

            // Устанавливаем новый access token
            res.cookie("token", result.token, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 минут
            });

            res.status(200).json({
                success: true,
                message: "Токены успешно обновлены"
            });
        } catch (error) {
            console.error('❌ Refresh error:', error);

            // Очищаем cookies при ошибке
            const cookieOptions = getSafariCookieOptions(req);
            res.clearCookie("token", cookieOptions);
            res.clearCookie("refreshToken", cookieOptions);

            next(error);
        }
    }

    async verify(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, code } = req.body;
            const result = await authService.verifyCode(email, code);

            const cookieOptions = getSafariCookieOptions(req);

            res.cookie("token", result.token, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 минут
            });

            res.cookie("refreshToken", result.refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
            });

            return res.status(200).json({
                success: true,
                message: "Email подтвержден и пользователь активирован",
                user: result.user
            });
        } catch (err) {
            next(err);
        }
    }

    async validateResetToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.query.token as string;

            if (!token) {
                res.status(400).json({ error: "Токен обязателен" });
                return;
            }

            const isValid = await authService.validatePasswordResetToken(token);

            if (!isValid) {
                res.status(400).json({ error: "Токен недействителен или истек" });
                return;
            }

            res.status(200).json({ message: "Токен действителен" });
        } catch (err) {
            next(err);
        }
    }

    async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ error: "Email обязателен" });
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({ error: "Email некорректный" });
                return;
            }
            await authService.createPasswordResetToken(email, res);
            res.status(200).json({
                message: "Если аккаунт с таким email существует, на него отправлена ссылка для сброса пароля"
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                res.status(400).json({ error: "Токен и новый пароль - обязательны" });
                return;
            }
            await authService.resetPasswordResetToken(token, newPassword);
            res.status(200).json({ message: "Пароль успешно изменен" });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const cookieOptions = getSafariCookieOptions(req);

            res.clearCookie("token", cookieOptions);
            res.clearCookie("refreshToken", cookieOptions);

            res.status(200).json({
                success: true,
                message: "Успешный выход"
            });
        } catch (error) {
            next(error);
        }
    }
}