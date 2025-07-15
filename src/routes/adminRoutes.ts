import { Router } from "express";
import { AdminController } from "@/controllers/AdminController";
import rateLimit from 'express-rate-limit';
import { authMiddleware, adminMiddleware } from "@/middlewares/authMiddleWare";

const router = Router();
const adminController = new AdminController();

const baseLimiterConfig = {
    windowMs: 15 * 60 * 1000, // 15 минут
    standardHeaders: true,
    legacyHeaders: false,
};

const adminActionLimiter = rateLimit({
    ...baseLimiterConfig,
    max: 20,
    message: {
        error: "Слишком много админских действий. Попробуйте позже."
    },
});

const criticalActionLimiter = rateLimit({
    ...baseLimiterConfig,
    max: 10,
    message: {
        error: "Слишком много критичных действий. Попробуйте позже."
    },
});

// Получить всех пользователей
router.get("/users", authMiddleware, adminMiddleware, adminController.getAllUsers);
router.get("/users/pending",authMiddleware,adminMiddleware,adminController.getUsersPendingChanges)
// Получить статистику
router.get("/stats", authMiddleware, adminMiddleware, adminController.getAdminStats);

// Редактировать пользователя
router.put("/users/:userId", authMiddleware, adminMiddleware, adminActionLimiter, adminController.editUser);

// Забанить пользователя
router.post("/users/:userId/ban", authMiddleware, adminMiddleware, criticalActionLimiter, adminController.banUser);

// Разбанить пользователя
router.post("/users/:userId/unban", authMiddleware, adminMiddleware, criticalActionLimiter, adminController.unbanUser);

// Отправить предупреждение
router.post("/users/:userId/warning", authMiddleware, adminMiddleware, criticalActionLimiter, adminController.sendWarning);

// Одобрить изменения профиля
router.post("/users/:userId/approve-changes", authMiddleware, adminMiddleware, adminActionLimiter, adminController.approveUserChanges);

// Отклонить изменения профиля
router.post("/users/:userId/reject-changes", authMiddleware, adminMiddleware, adminActionLimiter, adminController.rejectUserChanges);
router.post("/users/:userId/approveSpecificFields",authMiddleware,adminMiddleware,adminActionLimiter,adminController.approveSpecificFields);
export default router;