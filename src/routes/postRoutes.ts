
import { Router } from "express";
import { PostController } from "@/controllers/PostController";
import rateLimit from 'express-rate-limit';
import {authMiddleware} from "@/middlewares/authMiddleWare";

const router = Router();
const postController = new PostController();

// Rate limiting для создания постов
const createPostLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 10, // максимум 10 постов за 15 минут
    message: {
        error: "Слишком много постов. Попробуйте позже."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 минута
    max: 30, // 30 поисковых запросов в минуту
    message: {
        error: "Слишком много поисковых запросов."
    },
});

// =================== ПУБЛИЧНЫЕ РОУТЫ ===================
// Лента постов (без авторизации)
router.get("/feed", postController.getFeed);

// Получение поста по ID (без авторизации)
router.get("/:id", postController.getPostById);

// Поиск постов (с лимитами)
router.get("/search", searchLimiter, postController.searchPosts);

// Клинические случаи (публичные)
router.get("/cases/clinical", postController.getClinicalCases);

// Посты по специальности (публичные)
router.get("/specialty/:specialty", postController.getPostsBySpecialty);

// =================== АВТОРИЗОВАННЫЕ РОУТЫ ===================
// Создание поста (требует авторизации + лимиты)
router.post("/", authMiddleware, createPostLimiter, postController.createPost);

// Мои посты (требует авторизации)
router.get("/my/posts", authMiddleware, postController.getMyPosts);

// Посты конкретного пользователя (можно без авторизации)
router.get("/user/:userId", postController.getUserPosts);

// Обновление поста (требует авторизации)
router.put("/:id", authMiddleware, postController.updatePost);

// Удаление поста (требует авторизации)
router.delete("/:id", authMiddleware, postController.deletePost);

// Лайк/анлайк поста (требует авторизации)
router.post("/:id/like", authMiddleware, postController.likePost);
router.delete("/:id/like", authMiddleware, postController.unlikePost);

export default router;