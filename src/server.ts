import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import authRoutes from "@/routes/authRoutes";
// import searchRoutes from "./src/routes/searchRoutes";
import { connectDB } from "./config /db";
import {errorHandler} from "@/middlewares/errorHandler";
import postRoutes from "@/routes/postRoutes";

const app = express();

async function main() {
    try {
        await connectDB();
        app.use(express.json());

        app.use("/auth", authRoutes);
        app.use("/post", postRoutes);

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
