// src/dto/CommentDto.ts

// DTO для создания комментария
export interface CreateCommentDto {
    postId: string;
    text: string;
    parentId?: string; // для ответов на комментарии (опционально)
}

// DTO для обновления комментария
export interface UpdateCommentDto {
    text?: string;
}

// DTO для ответа клиенту (что возвращаем в API)
export interface CommentResponseDto {
    id: string;
    postId: string;
    text: string;

    // Информация об авторе (populate из User)
    author: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
    };

    // Статистика комментария
    stats: {
        likes: number;
        replies: number; // количество ответов на этот комментарий
    };

    // Для вложенности комментариев
    parentId?: string; // если это ответ на другой комментарий

    // Даты
    createdAt: Date;
    updatedAt: Date;

    // Метаинформация для UI
    isLiked?: boolean; // лайкнул ли текущий пользователь
    canEdit?: boolean; // может ли текущий пользователь редактировать
    canDelete?: boolean; // может ли текущий пользователь удалить
}

// DTO для фильтрации/поиска комментариев
export interface CommentFilterDto {
    postId?: string;           // комментарии к конкретному посту
    authorId?: string;         // комментарии конкретного пользователя
    parentId?: string | null;  // null для корневых комментариев, string для ответов

    // Пагинация
    limit?: number;
    skip?: number;

    // Сортировка
    sortBy?: 'createdAt' | 'likes';
    sortOrder?: 'asc' | 'desc';

    // Дополнительные фильтры
    dateFrom?: Date;
    dateTo?: Date;
}

// DTO для операций с лайками комментариев
export interface CommentLikeDto {
    commentId: string;
    action: 'like' | 'unlike';
}

// Легкий DTO для списков комментариев (без полной информации об авторе)
export interface CommentListItemDto {
    id: string;
    text: string;
    authorName: string; // firstName + lastName
    authorRole: string;
    stats: {
        likes: number;
        replies: number;
    };
    createdAt: Date;
    hasReplies: boolean; // есть ли ответы на этот комментарий
}