import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import authRoutes from "@/routes/authRoutes";
import searchRoutes from "./src/routes/searchRoutes"; // 👈 подключаем наши роуты



const app = express();

async function main() {
    app.use(express.json());

    // все /auth/* будут направлены в authRoutes
    app.use("/auth", authRoutes);
    app.use("/find", searchRoutes);

    app.listen(process.env.PORT || 4200, () => {
        console.log("🚀 Server started on port", process.env.PORT || 4200);
    });
}

main();
