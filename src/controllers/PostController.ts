// src/controllers/PostController.ts

// src/controllers/PostController.ts

import { Request, Response, NextFunction } from "express";
import { PostService } from "@/services/PostService";
import { CreatePostDto, UpdatePostDto, PostFilterDto } from "@/dto/PostDto";
import { ApiError } from "@/errors/ApiError";
import {AuthenticatedRequest} from "@/middlewares/authMiddleWare";


export class PostController {
    private postService: PostService;

    constructor() {
        this.postService = new PostService();

        // Биндим методы к контексту класса (важно для Express!)
        this.createPost = this.createPost.bind(this);
        this.getPostById = this.getPostById.bind(this);
        this.getUserPosts = this.getUserPosts.bind(this);
        this.getMyPosts = this.getMyPosts.bind(this); // Добавляем
        this.getFeed = this.getFeed.bind(this);
        this.updatePost = this.updatePost.bind(this);
        this.deletePost = this.deletePost.bind(this);
        this.likePost = this.likePost.bind(this);
        this.unlikePost = this.unlikePost.bind(this);
        this.searchPosts = this.searchPosts.bind(this);
        this.getClinicalCases = this.getClinicalCases.bind(this);
        this.getPostsBySpecialty = this.getPostsBySpecialty.bind(this);
    }

    // Создание поста
    async createPost(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
        try {
            const authorId = request.user?.id;

            if (!authorId) {
                response.status(401).json({
                    success: false,
                    error: "Пользователь не авторизован"
                });
                return;
            }

            // Базовая валидация
            if (!request.body.text || typeof request.body.text !== 'string') {
                response.status(400).json({
                    success: false,
                    error: "Текст поста обязателен"
                });
                return;
            }

            const postData: CreatePostDto = {
                text: request.body.text.trim(),
                images: Array.isArray(request.body.images) ? request.body.images : [],
                medicalTags: Array.isArray(request.body.medicalTags) ? request.body.medicalTags : [],
                speciality: Array.isArray(request.body.speciality) ? request.body.speciality : [],
                isCase: Boolean(request.body.isCase),
                difficulty: request.body.difficulty || 'intermediate',
                visibility: request.body.visibility || 'public',
                isAnonymous: Boolean(request.body.isAnonymous),
                links: Array.isArray(request.body.links) ? request.body.links : []
            };

            const newPost = await this.postService.createPost(postData, authorId);

            response.status(201).json({
                success: true,
                data: newPost,
                message: "Пост успешно создан"
            });

        } catch (error) {
            next(error);
        }
    }

    // Получение поста по ID
    async getPostById(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = request.params;

            if (!id) {
                response.status(400).json({
                    success: false,
                    error: "ID поста обязателен"
                });
                return;
            }

            const post = await this.postService.getPostById(id);

            response.status(200).json({
                success: true,
                data: post
            });

        } catch (error) {
            next(error);
        }
    }

    // Получение постов пользователя
    async getUserPosts(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = request.params;
            const page = this.parseIntQuery(request.query.page, 1, 1, 100);
            const limit = this.parseIntQuery(request.query.limit, 20, 1, 50);

            const posts = await this.postService.getUserPosts(userId, page, limit);

            response.status(200).json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Получение собственных постов (для авторизованного пользователя)
    async getMyPosts(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user?.id;

            if (!userId) {
                response.status(401).json({
                    success: false,
                    error: "Пользователь не авторизован"
                });
                return;
            }

            const page = this.parseIntQuery(request.query.page, 1, 1, 100);
            const limit = this.parseIntQuery(request.query.limit, 20, 1, 50);

            const posts = await this.postService.getUserPosts(userId, page, limit);

            response.status(200).json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                },
                message: `Найдено ${posts.length} ваших постов`
            });

        } catch (error) {
            next(error);
        }
    }

    // Лента постов
    async getFeed(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const page = this.parseIntQuery(request.query.page, 1, 1, 100);
            const limit = this.parseIntQuery(request.query.limit, 20, 1, 50);

            const posts = await this.postService.getFeed(page, limit);

            response.status(200).json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Обновление поста
    async updatePost(request: AuthenticatedRequest, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const authorId = request.user?.id;

            if (!authorId) {
                throw new ApiError(401, "Пользователь не авторизован");
            }

            if (!id) {
                throw new ApiError(400, "ID поста обязателен");
            }

            const updateData: UpdatePostDto = {
                text: request.body.text,
                medicalTags: request.body.medicalTags,
                specialty: request.body.specialty,
                difficulty: request.body.difficulty,
                visibility: request.body.visibility
            };

            const updatedPost = await this.postService.updatePost(id, updateData, authorId);

            response.status(200).json({
                success: true,
                data: updatedPost,
                message: "Пост успешно обновлен"
            });

        } catch (error) {
            next(error);
        }
    }

    // Удаление поста
    async deletePost(request: AuthenticatedRequest, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const authorId = request.user?.id?.toString();

            // Валидация
            if (!authorId) {
                throw new ApiError(401, "Пользователь не авторизован");
            }

            if (!id) {
                throw new ApiError(400, "ID поста обязателен");
            }


            // Вызов сервиса
            await this.postService.deletePost(id, authorId);


            response.status(200).json({
                success: true,
                message: "Пост успешно удален"
            });

        } catch (error: unknown) {
            const err = error as Error;
            console.log('💥 Controller error caught:', err.message);
            console.log('   - Error type:', err.constructor.name);
            if (error instanceof ApiError) {
                console.log('   - Status code:', (error as ApiError).status);
            }
            next(error);
        }
    }
    // Лайк поста
    async likePost(request: AuthenticatedRequest, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const userId = request.user?.id;

            if (!userId) {
                throw new ApiError(401, "Пользователь не авторизован");
            }

            if (!id) {
                throw new ApiError(400, "ID поста обязателен");
            }

            await this.postService.likePost(id, userId);

            response.status(200).json({
                success: true,
                message: "Лайк добавлен"
            });

        } catch (error) {
            next(error);
        }
    }

    // Убрать лайк
    async unlikePost(request: AuthenticatedRequest, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const userId = request.user?.id;

            if (!userId) {
                throw new ApiError(401, "Пользователь не авторизован");
            }

            if (!id) {
                throw new ApiError(400, "ID поста обязателен");
            }

            await this.postService.unlikePost(id, userId);

            response.status(200).json({
                success: true,
                message: "Лайк удален"
            });

        } catch (error) {
            next(error);
        }
    }

    // Поиск постов
    async searchPosts(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const filter: PostFilterDto = {
                specialty: request.query.specialty as string,
                isCase: request.query.isCase === 'true',
                difficulty: request.query.difficulty as 'beginner' | 'intermediate' | 'advanced',
                authorRole: request.query.authorRole as 'student' | 'doctor' | 'professor',
                tags: request.query.tags ? (request.query.tags as string).split(',') : undefined,
                dateFrom: this.parseDate(request.query.dateFrom),
                dateTo: this.parseDate(request.query.dateTo),
                limit: this.parseIntQuery(request.query.limit, 20, 1, 100),
                skip: this.parseIntQuery(request.query.skip, 0, 0, 10000)
            };

            const posts = await this.postService.searchPosts(filter);

            response.status(200).json({
                success: true,
                data: posts,
                pagination: {
                    limit: filter.limit,
                    skip: filter.skip,
                    hasMore: posts.length === filter.limit
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Получение клинических случаев
    async getClinicalCases(request: Request, response: Response, next: NextFunction) {
        try {
            const page = parseInt(request.query.page as string) || 1;
            const limit = Math.min(parseInt(request.query.limit as string) || 20, 50);

            const cases = await this.postService.getClinicalCases(page, limit);

            response.status(200).json({
                success: true,
                data: cases,
                pagination: {
                    page,
                    limit,
                    hasMore: cases.length === limit
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Получение постов по специальности
    async getPostsBySpecialty(request: Request, response: Response, next: NextFunction) {
        try {
            const { specialty } = request.params;
            const page = parseInt(request.query.page as string) || 1;
            const limit = Math.min(parseInt(request.query.limit as string) || 20, 50);

            if (!specialty) {
                throw new ApiError(400, "Специальность обязательна");
            }

            const posts = await this.postService.getPostsBySpecialty(specialty, page, limit);

            response.status(200).json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Утилитарные методы
    private parseIntQuery(value: unknown, defaultValue: number, min = 1, max = 1000): number {
        const parsed = typeof value === 'string' ? parseInt(value, 10) : NaN;
        if (isNaN(parsed) || parsed < min || parsed > max) {
            return defaultValue;
        }
        return parsed;
    }

    private parseDate(dateString: unknown): Date | undefined {
        if (typeof dateString !== 'string') return undefined;

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new ApiError(400, `Неверный формат даты: ${dateString}`);
        }
        return date;
    }
}