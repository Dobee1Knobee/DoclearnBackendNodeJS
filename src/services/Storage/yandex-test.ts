import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// Загружаем .env (если запускаешь через ts-node)
dotenv.config();

async function testYandex() {
    console.log("🧪 Проверяем подключение к Yandex Object Storage...");

    // Создаём клиент S3, но указываем endpoint Яндекса
    const client = new S3Client({
        region: process.env.YANDEX_REGION || "ru-central1",
        endpoint: "https://storage.yandexcloud.net",
        credentials: {
            accessKeyId: process.env.YANDEX_ACCESS_KEY!,
            secretAccessKey: process.env.YANDEX_SECRET_KEY!
        }
    });

    try {
        // Отправляем команду для получения списка бакетов
        const result = await client.send(new ListBucketsCommand({}));
        console.log("✅ Бакеты найдены:");
        console.log(result.Buckets);
    } catch (err) {
        console.error("❌ Ошибка:", err);
    }
}

testYandex();
