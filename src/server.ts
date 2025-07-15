import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "@/routes/authRoutes";
import postRoutes from "@/routes/postRoutes";
import userRoutes from "@/routes/userRoutes";
import { connectDB } from "./config /db";
import { errorHandler } from "@/middlewares/errorHandler";
import adminRoutes from "@/routes/adminRoutes";

const app = express();

async function main() {
    try {
        await connectDB();

        // 1. CORS должен быть ПЕРВЫМ (до cookieParser)
        app.use(cors({
            origin: [
                "http://localhost:3000",
                "http://doclearn.ru",
                "https://doclearn.ru",
                "https://www.doclearn.ru",
                "http://www.doclearn.ru",
                "http://192.168.1.136:3000"
            ],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: [
                "Content-Type",
                "Authorization",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Cookie"  // Добавлено для Safari
            ],
            optionsSuccessStatus: 200
        }));

        // 2. Preflight обработка для iOS
        app.options('*', (req, res) => {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cookie');
            res.sendStatus(200);
        });

        // 3. Cookie parser
        app.use(cookieParser());

        // 4. JSON parser
        app.use(express.json());

        // 5. Safari-specific middleware - ДОБАВЛЕНО
        app.use((req, res, next) => {
            const userAgent = req.headers['user-agent'] || '';
            const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');

            console.log('🔍 Request info:', {
                userAgent: userAgent.substring(0, 50),
                isSafari,
                url: req.url,
                method: req.method,
                cookies: Object.keys(req.cookies || {}),
                hasToken: !!req.cookies?.token,
                hasRefreshToken: !!req.cookies?.refreshToken
            });

            // Для iOS Safari устанавливаем специальные заголовки
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Origin', req.headers.origin);

            if (isSafari) {
                console.log('🍎 Safari detected - applying Safari-specific headers');

                // Дополнительные заголовки для Safari
                res.header('Vary', 'Origin');
                res.header('Access-Control-Expose-Headers', 'Set-Cookie');

                // Принудительно отключаем кэширование для Safari
                res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                res.header('Pragma', 'no-cache');
                res.header('Expires', '-1');
            }

            // Предотвращение кэширования для авторизации
            if (req.path.includes('/auth') || req.path.includes('/user')) {
                res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
                res.header('Pragma', 'no-cache');
                res.header('Expires', '0');
            }

            next();
        });

        // 6. Роуты
        app.use("/auth", authRoutes);
        app.use("/post", postRoutes);
        app.use("/user", userRoutes);
        app.use("/admin", adminRoutes);

        // 7. Обработка ошибок
        app.use(errorHandler);

        const port = process.env.PORT || 8080;
        app.listen(port, () => {
            console.log(`🚀 Server started on port ${port}`);
        });
    } catch (err) {
        console.error("❌ Ошибка запуска сервера:", err);
        process.exit(1);
    }
}

main();