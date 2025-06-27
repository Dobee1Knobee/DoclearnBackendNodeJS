import { Router } from "express";
import { UserController } from "@/controllers/UserController";
import rateLimit from 'express-rate-limit';
import { authMiddleware } from "@/middlewares/authMiddleWare";

const router = Router();
const userController = new UserController();

// =================== RATE LIMITING ===================
// Лимиты для поиска пользователей
const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 минута
    max: 20, // 20 поисковых запросов в минуту
    message: {
        error: "Слишком много поисковых запросов. Попробуйте позже."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Лимиты для подписок/отписок (предотвращаем спам)
const followLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 минут
    max: 30, // максимум 30 подписок/отписок за 5 минут
    message: {
        error: "Слишком много действий с подписками. Попробуйте позже."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Лимиты для просмотра профилей (предотвращаем парсинг)
const profileLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 минута
    max: 60, // 60 запросов профилей в минуту
    message: {
        error: "Слишком много запросов профилей."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =================== ПУБЛИЧНЫЕ РОУТЫ ===================
// Поиск пользователей (с лимитами, должен быть ПЕРЕД /:id!)
router.get("/search", searchLimiter, (req, res, next) => userController.searchUsers(req, res, next));

// Получить профиль пользователя по ID (с лимитами)
router.get("/:id/profile", profileLimiter, (req, res, next) => userController.getProfile(req, res, next));

// Получить подписчиков пользователя (с лимитами)
router.get("/:id/followers", profileLimiter, (req, res, next) => userController.getFollowers(req, res, next));

// Получить подписки пользователя (с лимитами)
router.get("/:id/following", profileLimiter, (req, res, next) => userController.getFollowing(req, res, next));

// Получить статистику пользователя (с лимитами)
router.get("/:id/stats", profileLimiter, (req, res, next) => userController.getUserStats(req, res, next));

// =================== АВТОРИЗОВАННЫЕ РОУТЫ ===================
// Получить свой профиль (требует авторизации)
router.get("/me", authMiddleware, (req, res, next) => userController.getMyProfile(req, res, next));
router.post("/update-my-profile",authMiddleware, (req, res, next) => {userController.updateMyProfile(req, res, next)});
// Проверить, подписан ли на пользователя (требует авторизации)
router.get("/:id/is-following", authMiddleware, (req, res, next) => userController.checkIsFollowing(req, res, next));

// Подписаться на пользователя (требует авторизации + лимиты)
router.post("/:id/follow", authMiddleware, followLimiter, (req, res, next) => userController.followUser(req, res, next));

// Отписаться от пользователя (требует авторизации + лимиты)
router.delete("/:id/follow", authMiddleware, followLimiter, (req, res, next) => userController.unfollowUser(req, res, next));

// =================== РАСШИРЕННЫЕ РОУТЫ ===================
// Получить рекомендации по подпискам (авторизованные пользователи)
// router.get("/recommendations", authMiddleware, (req, res, next) => userController.getRecommendations(req, res, next));

// Обновить профиль пользователя (авторизация обязательна)
// router.put("/me", authMiddleware, (req, res, next) => userController.updateProfile(req, res, next));

// Получить историю активности пользователя (только свою)
// router.get("/me/activity", authMiddleware, (req, res, next) => userController.getMyActivity(req, res, next));

// Массовая отписка (для очистки подписок)
// router.post("/me/unfollow-all", authMiddleware, followLimiter, (req, res, next) => userController.unfollowAll(req, res, next));

export default router;
