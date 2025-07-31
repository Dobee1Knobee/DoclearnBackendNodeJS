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

        app.use(cookieParser());

        // ✅ Исправленные CORS настройки для production
        app.use(cors({
            origin: [
                "http://localhost:3000",        // Для разработки
                "https://localhost:3000",       // Для разработки с HTTPS
                "http://doclearn.ru",           // HTTP версия сайта
                "https://doclearn.ru",          // ✅ HTTPS версия сайта
                "https://www.doclearn.ru",      // ✅ WWW версия
                "https://api.doclearn.ru",
                "http://192.168.1.136:3000"// ✅ API домен (если фронт делает запросы)
            ],
            credentials: true,                  // ✅ Обязательно для cookies
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        }));

        app.use(express.json());

        app.use((req, res, next) => {
            console.log('🔍 Request details:', {
                origin: req.get('origin'),
                host: req.get('host'),
                protocol: req.protocol,
                'x-forwarded-proto': req.get('x-forwarded-proto'),
                cookies: req.cookies,
                userAgent: req.get('user-agent'),
                time: Date.now()
            });
            next();
        });


        app.use("/auth", authRoutes);
        app.use("/post", postRoutes);
        app.use("/user", userRoutes);
        app.use("/admin", adminRoutes);

        // Обязательно внизу
        app.use(errorHandler);

        const port = process.env.PORT || 8080;
        app.listen(port, () => {
            console.log(`🚀 Server started on port ${port}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔒 Protocol: ${process.env.HTTPS ? 'HTTPS' : 'HTTP'}`);
        });
    } catch (err) {
        console.error("❌ Ошибка запуска сервера:", err);
        process.exit(1);
    }
}

main();