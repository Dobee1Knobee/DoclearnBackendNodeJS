import { CreatePostDto, UpdatePostDto, PostFilterDto, PostResponseDto } from "@/dto/PostDto";
import { ApiError } from "@/errors/ApiError";
import {IPostRepository} from "@/repositories /PostRepository";
import {Post} from "@/models/Post/Post";

export class PostService {
    private postRepository: IPostRepository;

    constructor(postRepository?: IPostRepository) {
        // Dependency Injection - можем заменить репозиторий для тестов
        this.postRepository = postRepository || new IPostRepository();
    }

    // Создание поста
    async createPost(postData: CreatePostDto, authorId: string): Promise<PostResponseDto> {
        try {
            // Валидация на уровне сервиса
            if (!postData.text || postData.text.trim().length < 10) {
                throw new ApiError(400, "Пост должен содержать минимум 10 символов");
            }

            if (postData.text.length > 5000) {
                throw new ApiError(400, "Пост не может быть длиннее 5000 символов");
            }

            // Создаем пост через репозиторий
            const post = await this.postRepository.create(postData, authorId);

            // Конвертируем в DTO для ответа
            return this.mapToResponseDto(post);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Ошибка при создании поста");
        }
    }

    // Получение поста по ID
    async getPostById(postId: string): Promise<PostResponseDto> {
        try {
            const post = await this.postRepository.findById(postId);

            if (!post) {
                throw new ApiError(404, "Пост не найден");
            }

            // Увеличиваем счетчик просмотров
            await this.postRepository.incrementStats(postId, "views");

            return this.mapToResponseDto(post);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Ошибка при получении поста");
        }
    }

    // Получение постов пользователя
    async getUserPosts(authorId: string, page = 1, limit = 20): Promise<PostResponseDto[]> {
        try {
            const skip = (page - 1) * limit;
            const posts = await this.postRepository.findByAuthor(authorId, limit, skip);

            return posts.map(post => this.mapToResponseDto(post));
        } catch (error) {
            throw new ApiError(500, "Ошибка при получении постов пользователя");
        }
    }

    // Лента постов
    async getFeed(page = 1, limit = 20): Promise<PostResponseDto[]> {
        try {
            const skip = (page - 1) * limit;
            const posts = await this.postRepository.findFeed(limit, skip);

            return posts.map(post => this.mapToResponseDto(post));
        } catch (error) {
            throw new ApiError(500, "Ошибка при получении ленты");
        }
    }

    // Поиск постов по фильтрам
    async searchPosts(filter: PostFilterDto): Promise<PostResponseDto[]> {
        try {
            // Устанавливаем разумные лимиты
            filter.limit = Math.min(filter.limit || 20, 100); // максимум 100 постов
            filter.skip = filter.skip || 0;

            const posts = await this.postRepository.findByFilter(filter);

            return posts.map(post => this.mapToResponseDto(post));
        } catch (error) {
            throw new ApiError(500, "Ошибка при поиске постов");
        }
    }

    // Обновление поста
    async updatePost(postId: string, updateData: UpdatePostDto, authorId: string): Promise<PostResponseDto> {
        try {

            // Проверяем, что пост существует и принадлежит пользователю
            const existingPost = await this.postRepository.findByIdRaw(postId);

            if (!existingPost) {
                throw new ApiError(404, "Пост не найден");
            }

            if (existingPost.authorId.toString() !== authorId) {
                throw new ApiError(403, "Нет прав для редактирования этого поста");
            }

            // Валидация обновляемых данных
            if (updateData.text && updateData.text.trim().length < 10) {
                throw new ApiError(400, "Текст поста должен содержать минимум 10 символов");
            }

            const updatedPost = await this.postRepository.update(postId, updateData);

            if (!updatedPost) {
                throw new ApiError(500, "Не удалось обновить пост");
            }

            return this.mapToResponseDto(updatedPost);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Ошибка при обновлении поста");
        }
    }

    // Удаление поста
    async deletePost(postId: string, authorId: string): Promise<void> {
        try {
            const existingPost = await this.postRepository.findByIdRaw(postId);

            if (!existingPost) {
                throw new ApiError(404, "Пост не найден");
            }

            // ✅ Приводим ObjectId к строке для сравнения
            if (existingPost.authorId.toString() !== authorId) {
                throw new ApiError(403, "Нет прав для удаления этого поста");
            }

            await this.postRepository.delete(postId);

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Ошибка при удалении поста");
        }
    }

    // Лайк поста
    async likePost(postId: string, userId: string): Promise<void> {
        try {
            // Проверяем, что пост существует
            const post = await this.postRepository.findById(postId);

            if (!post) {
                throw new ApiError(404, "Пост не найден");
            }

            // TODO: Проверить, что пользователь еще не лайкал этот пост
            // (нужна будет модель Likes)

            await this.postRepository.incrementStats(postId, "likes");
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Ошибка при добавлении лайка");
        }
    }

    // Убрать лайк
    async unlikePost(postId: string, userId: string): Promise<void> {
        try {
            const post = await this.postRepository.findById(postId);

            if (!post) {
                throw new ApiError(404, "Пост не найден");
            }

            // TODO: Проверить, что пользователь лайкал этот пост

            await this.postRepository.decrementStats(postId, "likes");
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Ошибка при удалении лайка");
        }
    }

    // Получение клинических случаев
    async getClinicalCases(page = 1, limit = 20): Promise<PostResponseDto[]> {
        try {
            const skip = (page - 1) * limit;

            // Используем фильтр для поиска клинических случаев
            const filter: PostFilterDto = {
                isCase: true,
                limit,
                skip
            };

            const posts = await this.postRepository.findByFilter(filter);

            return posts.map(post => this.mapToResponseDto(post));
        } catch (error) {
            throw new ApiError(500, "Ошибка при получении клинических случаев");
        }
    }

    // Получение постов по специальности
    async getPostsBySpecialty(specialty: string, page = 1, limit = 20): Promise<PostResponseDto[]> {
        try {
            const skip = (page - 1) * limit;

            const filter: PostFilterDto = {
                specialty,
                limit,
                skip
            };

            const posts = await this.postRepository.findByFilter(filter);

            return posts.map(post => this.mapToResponseDto(post));
        } catch (error) {
            throw new ApiError(500, "Ошибка при получении постов по специальности");
        }
    }

    // Приватный метод для конвертации модели в DTO
    // Полная безопасная версия mapToResponseDto с type assertions
    // Полная безопасная версия mapToResponseDto с type assertions
    private mapToResponseDto(post: Post): PostResponseDto {
        return {
            id: (post as any)._id.toString(),  // Type assertion для _id

            content: {
                text: post.content?.text || "",
                images: post.content?.images || [],
                // Фиксим links - маппим в правильный формат
                links: (post.content?.links || []).map(link => ({
                    url: link?.url || "",
                    title: link?.title || "",
                    description: link?.description || "",
                    previewImage: link?.previewImage || ""
                }))
            },

            medical: {
                tags: post.medical?.tags || [],
                specialty: post.medical?.specialty || undefined,
                isCase: post.medical?.isCase || false,
                difficulty: post.medical?.difficulty || "intermediate"
            },

            author: {
                // Type assertion для обхода проблем с типами
                id: typeof post.authorId === 'string'
                    ? post.authorId
                    : (post.authorId as any)?._id?.toString() || '',

                firstName: typeof post.authorId === 'object' && post.authorId
                    ? (post.authorId as any).firstName || ""
                    : "",

                lastName: typeof post.authorId === 'object' && post.authorId
                    ? (post.authorId as any).lastName || ""
                    : "",

                role: typeof post.authorId === 'object' && post.authorId
                    ? (post.authorId as any).role || ""
                    : "",

                specialty: typeof post.authorId === 'object' && post.authorId
                    ? (post.authorId as any).medical?.specialty || undefined
                    : undefined,

                isAnonymous: post.isAnonymous || false
            },

            stats: {
                likes: post.stats?.likes || 0,
                comments: post.stats?.comments || 0,
                shares: post.stats?.shares || 0,
                views: post.stats?.views || 0
            },

            visibility: post.visibility || "public",
            createdAt: post.createdAt || new Date(),
            updatedAt: post.updatedAt || post.createdAt || new Date()
        };
    }
}