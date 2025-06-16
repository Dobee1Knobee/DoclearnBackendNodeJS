import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors"; // ✅ Добавили cors
import cookieParser from "cookie-parser";

import authRoutes from "@/routes/authRoutes";
import postRoutes from "@/routes/postRoutes";
import userRoutes from "@/routes/userRoutes";
import { connectDB } from "./config /db";
import { errorHandler } from "@/middlewares/errorHandler";

const app = express();

async function main() {
    try {
        await connectDB();

        app.use(cookieParser());

        // ✅ Разрешаем CORS отовсюду (на время разработки)
        app.use(cors({
            origin: ["http://localhost:3000", "http://doclearn.ru"],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        }));

        app.use(express.json());

        app.use("/auth", authRoutes);
        app.use("/post", postRoutes);
        app.use("/user", userRoutes);

        // Обязательно внизу
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
