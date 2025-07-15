import { UserService } from "@/services/UserService";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/errors/ApiError";
import multer from 'multer';

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
    constructor() {
        this.userService = new UserService();
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
            const file = req.file;
            const { category, label, isPublic } = req.body;

            const result = await this.userService.uploadDocumentsToProfile(
                userId?.toString(),
                file,
                category,
                label,
                isPublic
            );

            res.status(200).json(result); // например, { message: "Документы загружены..." }
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

            const result = await this.userService.uploadEducationDocs(userId, file,educationId);
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
            const result = await this.userService.updateUserProfile(req.user.id, req.body);
            res.status(200).json({
                success: true,
                data: result
            })
        }catch(error) {
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
     * Поиск пользователей
     * GET /api/users/search?q=query&limit=20
     */
    async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query.q as string;
            const limit = parseInt(req.query.limit as string) || 20;

            if (!query || query.trim().length < 2) {
                throw new ApiError(400, "Поисковый запрос должен содержать минимум 2 символа");
            }

            const result = await this.userService.searchUsers(query, limit);
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