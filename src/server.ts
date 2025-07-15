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
                "X-Requested-With",  // Добавлено для iOS
                "Accept",
                "Origin"
            ],
            optionsSuccessStatus: 200 // Для старых браузеров
        }));

        // 2. Preflight обработка для iOS
        app.options('*', (req, res) => {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
            res.sendStatus(200);
        });

        // 3. Cookie parser с настройками для iOS
        app.use(cookieParser());

        // 4. JSON parser
        app.use(express.json());

        // 5. Middleware для установки правильных заголовков для iOS
        app.use((req, res, next) => {
            // Для iOS Safari
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Origin', req.headers.origin);

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
