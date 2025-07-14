import {NextFunction, Router} from "express";
import { AuthController } from "@/controllers/AuthController";
import rateLimit from 'express-rate-limit';

const router = Router();
const controller = new AuthController();
const baseLimiterConfig = {
    windowMs: 15 * 60 * 1000, // 15 минут
    standardHeaders: true,     // Современные заголовки
    legacyHeaders: false,      // Отключаем устаревшие X-RateLimit-*
};

// Rate limiting для чувствительных операций
const authLimiter = rateLimit({
    ...baseLimiterConfig,
    max: 5, // максимум 5 попыток за 15 минут
    message: {
        error: "Слишком много попыток входа. Попробуйте позже."
    },
});

const passwordResetLimiter = rateLimit({
    ...baseLimiterConfig,
    message: {
        error: "Слишком много запросов на сброс пароля. Попробуйте позже."
    },
});
router.post("/register", controller.register);
router.post("/login",controller.login)
router.post("/refresh", async (req, res, next) => {
    await controller.refresh(req, res, next);
});
router.post("/verify-email", async (req, res,next) => {
    await controller.verify(req, res,next);
});


// POST /api/auth/request-password-reset - Запрос на сброс пароля
router.post("/request-password-reset", passwordResetLimiter, controller.requestPasswordReset);

// GET /api/auth/validate-token/:token - Проверка валидности токена сброса
router.get("/validate-token", controller.validateResetToken);

// POST /api/auth/reset-password - Сброс пароля по токену
router.post("/reset-password", controller.resetPassword);
export default router;
