import { FILE_CONFIGS, FileType } from '@/config /fileUpload.config';
import * as process from "node:process";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
class FileUploadService {
    private bucketName: string;
    private s3Client: S3Client;
    private endpoint : string;

    constructor() {

        this.s3Client = new S3Client({
            region: process.env.YANDEX_REGION || "ru-central1",
            endpoint: "https://storage.yandexcloud.net",
            credentials: {
                accessKeyId: process.env.YANDEX_ACCESS_KEY!,
                secretAccessKey: process.env.YANDEX_SECRET_KEY!
            }
        });

        this.bucketName = process.env.YANDEX_BUCKET_NAME || "doclearn";
        this.endpoint = "https://storage.yandexcloud.net";
    }

    async uploadFile(file: any, fileType: FileType, userId: string) {
        // 1. Получить конфиг для типа файла
        const config = FILE_CONFIGS[fileType];

        // 2. Валидировать файл
        this.validateFile(file, config);

        // 3. Генерировать имя файла
        const fileName = this.generateFileName(userId, file.originalname);

        // 4. Загрузить в GCS
        const filePath = `${config.folder}/${fileName}`;
        try {
            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: filePath,
                Body: file.buffer,
                ContentType: file.mimetype
            }));

            // 6. Вернуть результат
            return { fileName, folder: config.folder, url: `${this.endpoint}/${this.bucketName}/${filePath}` };

        } catch (err: any) {
            console.error("❌ Ошибка загрузки файла:", err);
            throw new Error(`Ошибка загрузки файла: ${err.message}`);
        }

    }

    async getSignedUrl(fileName: string, fileType: FileType) {
        // 1. Получаем конфиг по типу файла
        const config = FILE_CONFIGS[fileType];

        // 2. Формируем путь к файлу в бакете
        const filePath = `${config.folder}/${fileName}`;

        try {
            // 3. Создаём команду на получение файла
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: filePath
            });

            // 4. Генерируем временную подписанную ссылку
            const signedUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn: config.signedUrlExpiry / 1000 // AWS ждёт секунды, а не миллисекунды
            });

            return signedUrl;
        } catch (err: any) {
            console.error("❌ Ошибка генерации Signed URL:", err);
            throw new Error(`Ошибка генерации Signed URL: ${err.message}`);
        }
    }

    private generateFileName(userId: string,originalName: string) {
        const dotIndex = originalName.lastIndexOf('.');
        const extension = originalName.substring(dotIndex);
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2,5);
        const fileName = `${userId}_${timestamp}_${randomString}${extension}`;
        return fileName;
    }
    private validateFile(file: any, config: any) {
        // 1. Проверить размер
        if (file.size > config.maxSize) {
            throw new Error(`File too large. Max size: ${config.maxSize}`);
        }

        // 2. Проверить тип
        if (!config.types.includes(file.mimetype)) {
            throw new Error(`Invalid file type. Allowed: ${config.types.join(', ')}`);
        }
    }
}

export default FileUploadService;
