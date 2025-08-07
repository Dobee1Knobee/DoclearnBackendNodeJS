import { UserService } from "@/services/UserService";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/errors/ApiError";
import multer from 'multer';
import logger from "@/logger";
import {UserSearchService} from "@/services/SearchUsersService";
// Расширяем Request для типизации JWT payload
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
const upload = multer();

export class UserController {
    private userService: UserService;
    private searchService: UserSearchService;

    constructor() {
        this.userService = new UserService();
        this.searchService = new UserSearchService();
    }

    async uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                throw new ApiError(401, "Пользователь не аутентифицирован");
            }

            const file = req.file;
            if (!file) {
                throw new ApiError(400, "Файл не загружен");
            }

            const result = await this.userService.uploadAvatar(userId, file);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async uploadDocumentsToProfile(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                logger.error("❌ Пользователь не аутентифицирован");
                throw new ApiError(401, "Пользователь не аутентифицирован");
            }

            const file = req.file;
            const { category, label, isPublic } = req.body;

            const result = await this.userService.uploadDocumentsToProfile(
                userId,
                file,
                category,
                label,
                isPublic
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async uploadEducationDoc(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            const educationId = req.query?.educationId as string;

            if (!educationId) {
                throw new ApiError(400, "ID образования обязателен");
            }

            if (!userId) {
                throw new ApiError(401, "Пользователь не аутентифицирован");
            }

            const file = req.file;
            if (!file) {
                throw new ApiError(400, "Файл не загружен");
            }

            const result = await this.userService.uploadEducationDocs(userId, file, educationId);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Получить профиль пользователя по ID
     * GET /api/users/:id/profile
     */
    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.id;

            if (!userId) {
                throw new ApiError(400, "ID пользователя обязателен");
            }

            const result = await this.userService.getUserProfile(userId);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Получить текущий профиль (аутентифицированного пользователя)
     * GET /api/users/me
     */
    async getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new ApiError(401, "Пользователь не аутентифицирован");
            }

            const result = await this.userService.getUserProfile(req.user.id);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async updateMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new ApiError(401, "Пользователь не аутентифицирован");
            }

            console.log('Входящие данные в контроллере:', JSON.stringify(req.body, null, 2));

            // Преобразуем специализации ЗДЕСЬ, в контроллере
            let processedData = { ...req.body };

            if (processedData.specializations) {
                console.log('Преобразуем специализации в контроллере...');

                processedData.specializations = processedData.specializations.map((spec: any, index: number) => {
                    console.log(`Специализация ${index} до преобразования:`, spec);

                    // Валидация
                    if (!spec.specializationId) {
                        throw new ApiError(400, 'specializationId обязателен для специализации');
                    }

                    const methodValue = spec.method?.type || spec.method;
                    const validMethods = ['Ординатура', 'Профессиональная переподготовка'];
                    if (!methodValue || !validMethods.includes(methodValue)) {
                        throw new ApiError(400, `Неверный метод: ${methodValue}. Допустимые: ${validMethods.join(', ')}`);
                    }

                    const categoryValue = spec.qualificationCategory?.type || spec.qualificationCategory;
                    if (categoryValue) {
                        const validCategories = ['Вторая категория', 'Первая категория', 'Высшая категория'];
                        if (!validCategories.includes(categoryValue)) {
                            throw new ApiError(400, `Неверная категория: ${categoryValue}. Допустимые: ${validCategories.join(', ')}`);
                        }
                    }

                    // Преобразование в формат БД
                    const transformed = {
                        specializationId: spec.specializationId,
                        name: spec.name,
                        method: methodValue, // Простая строка для БД
                        qualificationCategory: categoryValue, // Простая строка для БД
                        main: Boolean(spec.main)
                    };

                    console.log(`Специализация ${index} после преобразования:`, transformed);
                    return transformed;
                });
            }

            console.log('Финальные данные для сервиса:', JSON.stringify(processedData, null, 2));

            const result = await this.userService.updateUserProfile(req.user.id, processedData);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Получить подписчиков пользователя
     * GET /api/users/:id/followers
     */
    async getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.id;

            if (!userId) {
                throw new ApiError(400, "ID пользователя обязателен");
            }

            const result = await this.userService.getFollowers(userId);
            res.status(200).json({
                success: true,
                data: result,
                count: result.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Получить подписки пользователя
     * GET /api/users/:id/following
     */
    async getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.id;

            if (!userId) {
                throw new ApiError(400, "ID пользователя обязателен");
            }

            const result = await this.userService.getFollowing(userId);
            res.status(200).json({
                success: true,
                data: result,
                count: result.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Подписаться на пользователя
     * POST /api/users/:id/follow
     */
    async followUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const followingId = req.params.id;
            const followerId = req.user?.id;

            if (!followerId) {
                throw new ApiError(401, "Пользователь не аутентифицирован");
            }

            if (!followingId) {
                throw new ApiError(400, "ID пользователя для подписки обязателен");
            }

            const result = await this.userService.followUser(followerId, followingId);
            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Отписаться от пользователя
     * DELETE /api/users/:id/follow
     */
    async unfollowUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const followingId = req.params.id;
            const followerId = req.user?.id;

            if (!followerId) {
                throw new ApiError(401, "Пользователь не аутентифицирован");
            }

            if (!followingId) {
                throw new ApiError(400, "ID пользователя для отписки обязателен");
            }

            const result = await this.userService.unfollowUser(followerId, followingId);
            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Проверить, подписан ли текущий пользователь на другого
     * GET /api/users/:id/is-following
     */
    async checkIsFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const followingId = req.params.id;
            const followerId = req.user?.id;

            if (!followerId) {
                throw new ApiError(401, "Пользователь не аутентифицирован");
            }

            if (!followingId) {
                throw new ApiError(400, "ID пользователя обязателен");
            }

            const isFollowing = await this.userService.isFollowing(followerId, followingId);
            res.status(200).json({
                success: true,
                data: { isFollowing }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Поиск пользователей с полнотекстовым поиском
     * GET /api/users/search?q=query&limit=20
     */
    async searchUsers(req: Request, res: Response, next: NextFunction): Promise<e.Response<any, Record<string, any>>> {
        try {
            const query = req.query.q as string;
            const limit = parseInt(req.query.limit as string) || 20;

            // Обрабатываем пустой запрос
            if (!query || query.trim().length === 0) {
                return res.status(200).json({
                    success: true,
                    data: {
                        users: [],
                        total: 0,
                        query: query,
                        message: 'Пустой запрос'
                    },
                    total: 0,
                    count: 0
                });
            }

            // Используем новый метод searchUsers
            const result = await this.searchService.searchUsers(query, limit);

            res.status(200).json({
                success: true,
                data: result,
                total: result.total,
                count: result.users.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Автодополнение для поиска
     * GET /api/users/autocomplete?q=prefix&limit=5
     */
    async autocomplete(req: Request, res: Response, next: NextFunction): Promise<e.Response<any, Record<string, any>>> {
        try {
            const prefix = req.query.q as string;
            const limit = parseInt(req.query.limit as string) || 5;

            if (!prefix || prefix.length < 2) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    count: 0
                });
            }

            const result = await this.searchService.autocomplete(prefix, limit);

            res.status(200).json({
                success: true,
                data: result,
                count: result.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Поиск по email
     * GET /api/users/search/email?email=user@example.com
     */
    async searchByEmail(req: Request, res: Response, next: NextFunction): Promise<e.Response<any, Record<string, any>>> {
        try {
            const email = req.query.email as string;

            if (!email) {
                throw new ApiError(400, "Email обязателен для поиска");
            }

            const result = await this.searchService.searchByEmail(email);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Пользователь с таким email не найден"
                });
            }

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Получить статистику пользователя
     * GET /api/users/:id/stats
     */
    async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.id;

            if (!userId) {
                throw new ApiError(400, "ID пользователя обязателен");
            }

            const result = await this.userService.getUserStats(userId);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}