import { Storage } from '@google-cloud/storage';
import { FILE_CONFIGS, FileType } from '@/config /fileUpload.config';
import * as process from "node:process";

class FileUploadService {
    private storage: Storage;
    private bucketName: string;

    constructor() {
        this.storage = new Storage({
            projectId: process.env.GCS_PROJECT_ID,
            keyFilename: process.env.GCS_KEY_PATH
        });
        this.bucketName = process.env.GCS_BUCKET_NAME!; // ! говорит TS "точно не undefined"
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
        const gcsFile = this.storage.bucket(this.bucketName).file(filePath);
        await gcsFile.save(file.buffer, { metadata: { contentType: file.mimetype } });

        // 5. Вернуть результат
        return { fileName, folder: config.folder };
    }

    async getSignedUrl(fileName: string,fileType: FileType) {
       const config = FILE_CONFIGS[fileType];
       const filePath = `${config.folder}/${fileName}`;
       const gcsFile = this.storage.bucket(this.bucketName).file(filePath);
        const [signedUrl] = await gcsFile.getSignedUrl({
            action: 'read',
            expires: Date.now() + config.signedUrlExpiry
        });
        return signedUrl;
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

    private generateFileName(userId: string,originalName: string) {
        const dotIndex = originalName.lastIndexOf('.');
        const extension = originalName.substring(dotIndex);
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2,5);
        const fileName = `${userId}_${timestamp}_${randomString}${extension}`;
        return fileName;
    }
}
export default FileUploadService;
