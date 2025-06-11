import { User, UserModel } from "@/models/User/User";
import mongoose from "mongoose";
import { ApiError } from "@/errors/ApiError";
import { UserDto } from "@/dto/UserDto";
import { mapUserToPublicDto } from "@/utils/toPublicUser";
import {IUserRepository, UserRepository} from "@/repositories /UserRepository";

export class UserService {
    private userRepository: IUserRepository;

    constructor(userRepository?: IUserRepository) {
        this.userRepository = userRepository || new UserRepository();
    }

    /**
     * Универсальная обработка ошибок - DRY принцип
     * @private
     */
    private handleError(error: unknown, defaultMessage: string): never {
        if (error instanceof ApiError) {
            throw error; // Перебрасываем кастомные ошибки как есть
        }

        if (error instanceof Error) {
            console.error(`UserService Error: ${error.message}`, error.stack);
        } else {
            console.error('Unknown error in UserService:', error);
        }

        throw new ApiError(500, defaultMessage);
    }

    /**
     * Получить профиль пользователя
     */
    async getUserProfile(userId: string): Promise<UserDto> {
        try {
            const result = await this.userRepository.findByIdForProfile(userId);
            if (!result) {
                throw new ApiError(404, "Пользователь не найден");
            }
            return mapUserToPublicDto(result);
        } catch (error) {
            this.handleError(error, "Ошибка при получении профиля пользователя");
        }
    }

    /**
     * Получить список подписчиков пользователя
     */
    async getFollowers(userId: string): Promise<UserDto[]> {
        try {
            // Сначала проверим, что пользователь существует
            const userExists = await this.userRepository.findByIdForProfile(userId);
            if (!userExists) {
                throw new ApiError(404, "Пользователь не найден");
            }

            const followers = await this.userRepository.findFollowers(userId);
            return followers.map(user => mapUserToPublicDto(user));
        } catch (error) {
            this.handleError(error, "Ошибка при получении подписчиков");
        }
    }

    /**
     * Получить список подписок пользователя
     */
    async getFollowing(userId: string): Promise<UserDto[]> {
        try {
            // Проверяем существование пользователя
            const userExists = await this.userRepository.findByIdForProfile(userId);
            if (!userExists) {
                throw new ApiError(404, "Пользователь не найден");
            }

            const following = await this.userRepository.findFollowing(userId);
            return following.map(user => mapUserToPublicDto(user));
        } catch (error) {
            this.handleError(error, "Ошибка при получении подписок");
        }
    }

    /**
     * Проверить, подписан ли один пользователь на другого
     */
    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        try {
            return await this.userRepository.isFollowing(followerId, followingId);
        } catch (error) {
            this.handleError(error, "Ошибка при проверке подписки");
        }
    }

    /**
     * Подписаться на пользователя
     */
    async followUser(followerId: string, followingId: string): Promise<{ message: string }> {
        try {
            await this.userRepository.follow(followerId, followingId);
            return { message: "Успешно подписались на пользователя" };
        } catch (error) {
            this.handleError(error, "Ошибка при подписке на пользователя");
        }
    }

    /**
     * Отписаться от пользователя
     */
    async unfollowUser(followerId: string, followingId: string): Promise<{ message: string }> {
        try {
            await this.userRepository.unfollow(followerId, followingId);
            return { message: "Успешно отписались от пользователя" };
        } catch (error) {
            this.handleError(error, "Ошибка при отписке от пользователя");
        }
    }

    /**
     * Поиск пользователей по имени/фамилии/email
     */
    async searchUsers(query: string, limit: number = 20): Promise<UserDto[]> {
        try {
            if (!query.trim()) {
                return [];
            }

            // Создаем поисковый запрос
            const searchRegex = new RegExp(query, 'i'); // case-insensitive поиск

            const users = await UserModel.find({
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex }
                ],
                isVerified: true // Показываем только верифицированных пользователей
            })
                .select('firstName lastName email role placeWork stats isVerified createdAt')
                .limit(limit)
                .lean();

            return users.map(user => mapUserToPublicDto(user));
        } catch (error) {
            this.handleError(error, "Ошибка при поиске пользователей");
        }
    }

    /**
     * Получить пользователя без пароля (для внутреннего использования)
     */
    async getUserWithoutPassword(userId: string): Promise<UserDto> {
        try {
            const user = await this.userRepository.findByIdWithoutPassword(userId);
            if (!user) {
                throw new ApiError(404, "Пользователь не найден");
            }
            return mapUserToPublicDto(user);
        } catch (error) {
            this.handleError(error, "Ошибка при получении пользователя");
        }
    }

    /**
     * Получить статистику пользователя (количество подписчиков, подписок и постов)
     */
    async getUserStats(userId: string): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
    }> {
        try {
            const user = await this.userRepository.findByIdForProfile(userId);
            if (!user) {
                throw new ApiError(404, "Пользователь не найден");
            }

            return {
                followersCount: user.stats?.followersCount || 0,
                followingCount: user.stats?.followingCount || 0,
                postsCount: user.stats?.postsCount || 0
            };
        } catch (error) {
            this.handleError(error, "Ошибка при получении статистики пользователя");
        }
    }

    // TODO: Добавить обновление профиля
    // async updateUserProfile(userId: string, updateData: Partial<UserDto>): Promise<UserDto> {
    //     try {
    //         // Валидация данных
    //         // Обновление в базе
    //         // Возврат обновленного пользователя
    //     } catch (error) {
    //         this.handleError(error, "Ошибка при обновлении профиля");
    //     }
    // }
}