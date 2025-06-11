import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import authRoutes from "@/routes/authRoutes";
// import searchRoutes from "./src/routes/searchRoutes";
import { connectDB } from "./config /db";
import {errorHandler} from "@/middlewares/errorHandler";
import postRoutes from "@/routes/postRoutes";
import cookieParser from "cookie-parser";
import userRoutes from "@/routes/userRoutes";

const app = express();

async function main() {
    try {
        await connectDB();
        app.use(cookieParser());    // ← ОБЯЗАТЕЛЬНО ДО роутов!

        app.use(express.json());

        app.use("/auth", authRoutes);
        app.use("/post", postRoutes);
        app.use("/user",userRoutes)
        // Обязательно внизу
        app.use(errorHandler); // 👈 теперь без ошибки

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
