import mongoose, { Schema, Types, model, InferSchemaType } from "mongoose";

const fileSchema = new Schema({
    // Основная информация о файле
    fileName: {
        type: String,
        required: true,
        unique: true // уникальное имя в GCS
    },
    originalName: {
        type: String,
        required: true
    },

    // Тип файла
    fileType: {
        type: String,
        enum: ['avatar', 'document', 'postImage',"documentProfile"],
        required: true
    },

    // Метаданные файла
    size: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },

    // Владелец файла
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Жизненный цикл файла
    uploadedAt: {
        type: Date,
        default: Date.now
    },

    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false
    },

    // Для документов - когда удалить
    deleteAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});

// Индексы
fileSchema.index({ userId: 1, fileType: 1 });
fileSchema.index({ isDeleted: 1, deleteAt: 1 });

// Экспорт типов
export type File = InferSchemaType<typeof fileSchema>;
export const FileModel = model<File>("File", fileSchema);