import mongoose, { Schema, Types, model, InferSchemaType } from "mongoose";
import {string} from "zod";

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
        type: Schema.Types.ObjectId, // ← ИСПРАВЛЕНО: String → ObjectId
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
        previewImageId: {
            type: Schema.Types.ObjectId,
            ref: 'File'
        },
        imageIds: [{
            type: Schema.Types.ObjectId,
            ref: 'File'
        }],
        links: [
            {
                url: { type: String },
                title: { type: String },
                description: { type: String },
                previewImage: { type: String },
            },
        ],
    },

    medical: {
        type: {
            tags: {
                type: [medicalTagSchema],
                default: []
            },
            specialty: {
                type: String,
                enum: [
                    'cardiology', 'neurology', 'oncology', 'pediatrics',
                    'surgery', 'psychiatry', 'radiology', 'emergency',
                    'internal_medicine', 'dermatology', 'orthopedics', 'other'
                ]
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
        default: {}
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
            saves: { type: Number, default: 0 },
        },
        default: {}
    },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],// ← Новое поле

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

// Экспорт типов
export type Post = InferSchemaType<typeof postSchema>;
export type PublicPost = Omit<Post, "content.links">;

// Экспорт модели
export const PostModel = model<Post>("Post", postSchema);
