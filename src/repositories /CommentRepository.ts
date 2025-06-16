import {CreateCommentDto, UpdateCommentDto} from "@/dto/CommentDto";
import {Comment} from "@/models/Post/Comment";

export interface ICommentRepository {
    // Основные CRUD операции
    create(commentData: CreateCommentDto, authorId: string): Promise<Comment>;
    findById(commentId: string): Promise<Comment | null>;

    // Получение комментариев
    findByPost(postId: string, limit?: number, skip?: number): Promise<Comment[]>;
    findReplies(parentId: string, limit?: number, skip?: number): Promise<Comment[]>;

    // Обновление и удаление
    delete(commentId: string): Promise<boolean>;
    update(commentId: string, updateData: UpdateCommentDto): Promise<Comment | null>;

    // Статистика
    incrementRepliesCount(parentId: string): Promise<void>;
    decrementRepliesCount(parentId: string): Promise<void>;

    // Для будущих лайков (пока не реализуем)
    incrementLikes(commentId: string): Promise<void>;
    decrementLikes(commentId: string): Promise<void>;
}

export class CommentService {
    async findById(commentId: string): Promise<Comment | null> {

        return null;
    }
}