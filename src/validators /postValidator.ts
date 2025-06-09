import {ApiError} from "@/errors/ApiError";
import {CreatePostDto, UpdatePostDto} from "@/dto/PostDto";

export class PostValidator {
    static validateUpdateData(body: any): UpdatePostDto {
        // Проверка лишних полей
        const allowedFields = ['text', 'medicalTags', 'specialty', 'difficulty', 'visibility'];
        const extraFields = Object.keys(body).filter(key => !allowedFields.includes(key));

        if (extraFields.length > 0) {
            throw new ApiError(400, `Недопустимые поля: ${extraFields.join(', ')}`);
        }

        // Валидация типов
        if (body.text !== undefined && typeof body.text !== 'string') {
            throw new ApiError(400, "text должен быть строкой");
        }

        if (body.medicalTags !== undefined && !Array.isArray(body.medicalTags)) {
            throw new ApiError(400, "medicalTags должен быть массивом");
        }

        // Валидация enum значений
        if (body.visibility && !['public', 'followers_only', 'private'].includes(body.visibility)) {
            throw new ApiError(400, "Недопустимое значение visibility");
        }

        if (body.difficulty && !['beginner', 'intermediate', 'advanced'].includes(body.difficulty)) {
            throw new ApiError(400, "Недопустимое значение difficulty");
        }

        return {
            text: body.text,
            medicalTags: body.medicalTags,
            specialty: body.specialty,
            difficulty: body.difficulty,
            visibility: body.visibility
        };
    }

    //
    // static validatorCreatePost(body:any): CreatePostDto {
    //
    // }
}