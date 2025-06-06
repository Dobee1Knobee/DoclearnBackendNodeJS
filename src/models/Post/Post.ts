import mongoose, { Schema, Types, model, InferSchemaType } from "mongoose";

// Описание схемы поста
const postSchema = new Schema({
    authorId: {
        type: String,
        required: true,
        ref: "User", // связь с пользователем
    },
    content: {
        text: { type: String, required: true },
        // поле для превью-изображений
        previewImage: { type: String },  // Превью изображение для ленты
        images: [{ type: String }],      // Полные изображения
        links: [
            {
                url: { type: String },
                title: { type: String },
            },
        ],
    },
    createdAt: { type: Date, default: Date.now },
    stats: {
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
    },
});

// Тип Post — полное описание
export type Post = InferSchemaType<typeof postSchema>;

// Публичная версия Post — только для ленты
export type PublicPost = Omit<Post, "content.images" | "content.links">;

export const PostModel = model<Post>("Post", postSchema);
