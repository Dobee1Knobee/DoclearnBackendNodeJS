import mongoose, { Schema, Types, model, InferSchemaType } from "mongoose";

// Схема для медицинских тегов
const medicalTagSchema = new Schema({
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['symptom', 'diagnosis', 'treatment', 'specialty', 'other'],
        required: true
    }
}, { _id: false }); // _id: false чтобы не создавать лишние ID

// Описание схемы поста
const postSchema = new Schema({
    authorId: {
        type: String,
        required: true,
        ref: "User",
        index: true,
    },

    content: {
        text: {
            type: String,
            required: true,
            minLength: [10, "Пост должен содержать минимум 10 символов"],
            maxLength: [5000, "Пост не может быть длинее 5000 символов"]
        },
        previewImage: { type: String },
        images: [{ type: String }],
        links: [
            {
                url: { type: String },
                title: { type: String },
                description: { type: String },
                previewImage: { type: String },
            },
        ],
    },

    // ИСПРАВЛЯЕМ: делаем medical обязательным с дефолтами
    medical: {
        type: {
            tags: {
                type: [medicalTagSchema],
                default: [] // пустой массив по умолчанию
            },
            specialty: {
                type: String,
                enum: [
                    'cardiology', 'neurology', 'oncology', 'pediatrics',
                    'surgery', 'psychiatry', 'radiology', 'emergency',
                    'internal_medicine', 'dermatology', 'orthopedics', 'other'
                ]
                // НЕ required - может быть undefined
            },
            isCase: {
                type: Boolean,
                default: false
            },
            difficulty: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced'],
                default: 'intermediate'
            }
        },
        default: {} // дефолтный объект medical
    },

    visibility: {
        type: String,
        enum: ['public', 'followers_only', 'private'],
        default: 'public'
    },

    isAnonymous: { type: Boolean, default: false },

    stats: {
        type: {
            likes: { type: Number, default: 0 },
            comments: { type: Number, default: 0 },
            shares: { type: Number, default: 0 },
            views: { type: Number, default: 0 },
        },
        default: {} // дефолтный объект stats
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Индексы
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ "medical.specialty": 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

// Middleware для обновления updatedAt
postSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// ДОБАВЛЯЕМ: Экспорт типов
export type Post = InferSchemaType<typeof postSchema>;
export type PublicPost = Omit<Post, "content.images" | "content.links">;

// ДОБАВЛЯЕМ: Экспорт модели
export const PostModel = model<Post>("Post", postSchema);