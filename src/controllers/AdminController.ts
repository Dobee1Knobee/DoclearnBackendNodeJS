import { Request, Response, NextFunction } from "express";
import { AdminService } from "@/services/AdminService";
import { ApiError } from "@/errors/ApiError";
import { AuthenticatedRequest } from "@/middlewares/authMiddleWare";

const adminService = new AdminService();

export class AdminController {

    /**
     * Забанить пользователя
     * POST /api/admin/users/:userId/ban
     */
    async banUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;
            const { reason } = req.body;

            if (!reason || reason.trim().length < 3) {
                res.status(400).json({
                    success: false,
                    error: "Причина бана должна содержать минимум 3 символа"
                });
                return;
            }

            const result = await adminService.banUser(userId, adminId, reason.trim());

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Разбанить пользователя
     * POST /api/admin/users/:userId/unban
     */
    async unbanUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;

            const result = await adminService.unbanUser(userId, adminId);

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Редактировать пользователя
     * PUT /api/admin/users/:userId
     */
    async editUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;
            const updateData = req.body;

            if (!updateData || Object.keys(updateData).length === 0) {
                res.status(400).json({
                    success: false,
                    error: "Нет данных для обновления"
                });
                return;
            }

            const result = await adminService.editUser(adminId, userId, updateData);

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Получить всех пользователей с фильтрами
     * GET /api/admin/users
     */
    async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.id;
            const {
                page = "1",
                limit = "20",
                role,
                isBanned,
                isUserVerified,
                isDoctorVerified,
                search
            } = req.query;

            console.log('=== CONTROLLER DEBUG ===');
            console.log('Исходные query параметры:', req.query);
            console.log('isDoctorVerified тип:', typeof isDoctorVerified, 'значение:', isDoctorVerified);

            // Валидация параметров
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);

            if (isNaN(pageNum) || pageNum < 1) {
                res.status(400).json({
                    success: false,
                    error: "Некорректный номер страницы"
                });
                return;
            }

            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                res.status(400).json({
                    success: false,
                    error: "Лимит должен быть от 1 до 100"
                });
                return;
            }

            const filters: any = {};
            if (role) filters.role = role;

            if (isBanned !== undefined && isBanned !== null) {
                filters.isBanned = isBanned === 'true';
            }
            if (isUserVerified !== undefined && isUserVerified !== null) {
                filters.isUserVerified = isUserVerified === 'true';
            }
            if (isDoctorVerified !== undefined && isDoctorVerified !== null) {
                filters.isDoctorVerified = isDoctorVerified === 'true';
            }

            if (search) filters.search = search as string;


            const result = await adminService.getAllUsers(adminId, pageNum, limitNum, filters);

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Получить пользователей, ожидающих одобрения изменений
     * GET /api/admin/users/pending-changes
     */
    async getUsersPendingChanges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.id;
            const {
                page = "1",
                limit = "20",
                search
            } = req.query;

            // Валидация параметров
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);

            if (isNaN(pageNum) || pageNum < 1) {
                res.status(400).json({
                    success: false,
                    error: "Некорректный номер страницы"
                });
                return;
            }

            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                res.status(400).json({
                    success: false,
                    error: "Лимит должен быть от 1 до 100"
                });
                return;
            }

            const filters: any = {};
            if (search) filters.search = search as string;

            const result = await adminService.getUsersPendingChanges(adminId, pageNum, limitNum, filters);

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Отправить предупреждение пользователю
     * POST /api/admin/users/:userId/warning
     */
    async sendWarning(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;
            const { message, reason } = req.body;

            if (!message || message.trim().length < 5) {
                res.status(400).json({
                    success: false,
                    error: "Сообщение предупреждения должно содержать минимум 5 символов"
                });
                return;
            }

            // ✅ Исправляем вызов - передаем объект warning
            const result = await adminService.addWarning(userId, {
                message: message.trim(),
                issuedBy: adminId,
                reason: reason?.trim()
            });

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            next(error);
        }
    }
    /**
     * Одобрить изменения профиля пользователя
     * POST /api/admin/users/:userId/approve-changes
     */
    async approveUserChanges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;
            const { comment } = req.body;

            const result = await adminService.approveUserChanges(adminId, userId, comment);

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Отклонить изменения профиля пользователя
     * POST /api/admin/users/:userId/reject-changes
     */
    async rejectUserChanges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;
            const { comment } = req.body;

            if (!comment || comment.trim().length < 3) {
                res.status(400).json({
                    success: false,
                    error: "Комментарий к отклонению обязателен и должен содержать минимум 3 символа"
                });
                return;
            }

            const result = await adminService.rejectUserChanges(adminId, userId, comment.trim());

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            next(error);
        }
    }

    async approveSpecificFields(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const {userId} = req.params;
            const adminId = req.user!.id;
            const fieldsToApprove = req.body.fieldsToApprove;
            const comment = req.body.comment;

            // Базовая валидация на уровне контроллера
            if (!userId) {
                res.status(400).json({ message: "Не передан пользователь для изменений" });
                return;
            }

            if (!adminId) {
                res.status(400).json({ message: "Не удалось получить ID админа" });
                return;
            }

            if (!fieldsToApprove || !Array.isArray(fieldsToApprove)) {
                res.status(400).json({ message: "Не переданы поля для одобрения или неверный формат" });
                return;
            }

            // Вызов сервиса
            const result = await adminService.approveSpecificFields(
                adminId,
                userId,
                fieldsToApprove,
                comment
            );

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            next(error); // Передаем в error handler middleware
        }
    }
    /**
     * Получить статистику для админ панели
     * GET /api/admin/stats
     */
    async getAdminStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // TODO: Реализовать получение статистики
            // - Общее количество пользователей
            // - Забаненные пользователи
            // - Активные модерации
            // - Количество предупреждений за последний месяц

            res.status(200).json({
                success: true,
                data: {
                    totalUsers: 0,
                    bannedUsers: 0,
                    pendingModerations: 0,
                    warningsThisMonth: 0
                }
            });

        } catch (error) {
            next(error);
        }
    }
}