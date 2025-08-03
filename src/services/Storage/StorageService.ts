import 'dotenv/config';
const AWS = require('aws-sdk');
import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';

interface UploadFile {
    buffer?: Buffer;
    originalname?: string;
    mimetype?: string;
}

interface UploadResult {
    success: boolean;
    url?: string;
    key?: string;
    fileName?: string;
    error?: string;
}

class StorageService {
    private s3: any;
    private bucketName: string;

    constructor() {
        console.log('Инициализация StorageService (AWS SDK v2)...');
        console.log('Access Key:', process.env.YANDEX_ACCESS_KEY ? 'Установлен' : 'НЕ НАЙДЕН');
        console.log('Secret Key:', process.env.YANDEX_SECRET_KEY ? 'Установлен' : 'НЕ НАЙДЕН');
        console.log(process.env.YANDEX_ACCESS_KEY || process.env.YANDEX_SECRET_KEY)
        if (!process.env.YANDEX_ACCESS_KEY || !process.env.YANDEX_SECRET_KEY) {
            throw new Error('Отсутствуют ключи доступа');
        }

        // Настройка AWS SDK v2
        AWS.config.update({
            accessKeyId: process.env.YANDEX_ACCESS_KEY,
            secretAccessKey: process.env.YANDEX_SECRET_KEY,
            region: process.env.YANDEX_REGION || 'ru-central1',
            s3ForcePathStyle: true,
            signatureVersion: 'v4'
        });

        this.s3 = new AWS.S3({
            endpoint: 'https://storage.yandexcloud.net'
        });

        this.bucketName = process.env.YANDEX_BUCKET_NAME || 'doclearn';
    }

    // Загрузка файла
    async uploadFile(file: UploadFile, folder: string = ''): Promise<UploadResult> {
        try {
            const fileName = `${uuidv4()}-${file.originalname || 'file'}`;
            const key = folder ? `${folder}/${fileName}` : fileName;

            const params = {
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype || 'application/octet-stream'
            };

            const result = await this.s3.upload(params).promise();

            return {
                success: true,
                url: result.Location,
                key: key,
                fileName: fileName
            };
        } catch (error: any) {
            console.error('Ошибка загрузки файла:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Тест соединения
    async testConnection() {
        try {
            const result = await this.s3.listObjects({
                Bucket: this.bucketName,
                MaxKeys: 1
            }).promise();

            console.log('✅ Соединение работает!');
            return { success: true, result };
        } catch (error: any) {
            console.error('❌ Ошибка соединения:', error.message);
            return { success: false, error: error.message };
        }
    }

    getPublicUrl(key: string): string {
        return `https://storage.yandexcloud.net/${this.bucketName}/${key}`;
    }
}

export default new StorageService();