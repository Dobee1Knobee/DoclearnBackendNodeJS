import { User, UserModel } from "@/models/User/User";
import mongoose from "mongoose";
import { ApiError } from "@/errors/ApiError";
import { UserDto } from "@/dto/UserDto";
import { mapUserToPublicDto } from "@/utils/toPublicUser";
import {IUserRepository, UserRepository} from "@/repositories /UserRepository";
import {UpdateUserProfileDto} from "@/dto/UpdateUserProfile";

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
                isVerified: false // Показываем только верифицированных пользователей
            })
                .select('firstName lastName location experience rating bio email role placeWork contacts education stats isVerified')
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
// И заменяем updateUserProfile на версию с модерацией:
    async updateUserProfile(userId: string, updateData: UpdateUserProfileDto): Promise<{ message: string; requiresModeration: boolean }> {
        try {
            // 1. Валидация
            if (!userId || !updateData) {
                throw new ApiError(400, "Неверные параметры");
            }

            // 2. Проверка что приходят только допустимые поля
            this.validateAllowedFields(updateData);

            // 3. Проверка пользователя
            const user = await UserModel.findById(userId);
            if (!user) {
                throw new ApiError(404, "Пользователь не найден");
            }

            // 4. Валидация данных
            this.validateUpdateData(updateData);

            // 5. Определяем нужна ли модерация
            const requiresModeration = this.checkIfModerationRequired(updateData);

            if (requiresModeration) {
                // Сохраняем изменения на модерацию
                await UserModel.findByIdAndUpdate(userId, {
                    pendingChanges: {
                        data: updateData,
                        status: 'pending',
                        submittedAt: new Date()
                    }
                });

                return {
                    message: "Изменения отправлены на модерацию",
                    requiresModeration: true
                };
            } else {
                // Применяем изменения сразу
                await UserModel.findByIdAndUpdate(
                    userId,
                    { ...updateData },
                    { new: true, runValidators: true }
                );

                return {
                    message: "Профиль успешно обновлен",
                    requiresModeration: false
                };
            }

        } catch (error) {
            this.handleError(error, "Ошибка при обновлении профиля");
        }
    }

    /**
     * Проверяет, что в запросе только допустимые поля
     */
    private validateAllowedFields(updateData: any): void {
        const allowedFields = [
            'firstName', 'lastName', 'location', 'experience',
            'bio', 'placeWork', 'specialization', 'avatar',
            'contacts', 'education'
        ];

        const receivedFields = Object.keys(updateData);
        const invalidFields = receivedFields.filter(field => !allowedFields.includes(field));

        if (invalidFields.length > 0) {
            throw new ApiError(400, `Недопустимые поля: ${invalidFields.join(', ')}`);
        }
    }

    /**
     * Валидация содержимого полей
     */
    private validateUpdateData(updateData: UpdateUserProfileDto): void {
        if (updateData.firstName !== undefined && updateData.firstName.trim().length < 2) {
            throw new ApiError(400, "Имя должно содержать минимум 2 символа");
        }

        if (updateData.lastName !== undefined && updateData.lastName.trim().length < 2) {
            throw new ApiError(400, "Фамилия должна содержать минимум 2 символа");
        }

        if (updateData.location !== undefined && updateData.location.trim().length < 2) {
            throw new ApiError(400, "Местоположение должно содержать минимум 2 символа");
        }

        if (updateData.experience !== undefined && updateData.experience.trim().length < 1) {
            throw new ApiError(400, "Опыт работы не может быть пустым");
        }

        // Валидация контактов
        if (updateData.contacts !== undefined) {
            this.validateContacts(updateData.contacts);
        }

        // Валидация образования
        if (updateData.education !== undefined) {
            this.validateEducation(updateData.education);
        }
    }

    /**
     * Валидация контактов
     */
    private validateContacts(contacts: UpdateUserProfileDto['contacts']): void {
        if (!Array.isArray(contacts)) {
            throw new ApiError(400, "Контакты должны быть массивом");
        }

        const allowedContactTypes = ['phone', 'telegram', 'whatsapp', 'website', 'email', 'vk', 'facebook', 'twitter', 'instagram'];

        contacts.forEach((contact, index) => {
            if (!contact.type || !contact.value) {
                throw new ApiError(400, `Контакт ${index + 1}: тип и значение обязательны`);
            }

            if (!allowedContactTypes.includes(contact.type)) {
                throw new ApiError(400, `Контакт ${index + 1}: недопустимый тип ${contact.type}`);
            }

            if (contact.value.trim().length < 1) {
                throw new ApiError(400, `Контакт ${index + 1}: значение не может быть пустым`);
            }
        });
    }

    /**
     * Валидация образования
     */
    private validateEducation(education: UpdateUserProfileDto['education']): void {
        if (!Array.isArray(education)) {
            throw new ApiError(400, "Образование должно быть массивом");
        }

        education.forEach((edu, index) => {
            if (!edu.institution || edu.institution.trim().length < 2) {
                throw new ApiError(400, `Образование ${index + 1}: название учебного заведения обязательно`);
            }

            if (edu.graduationYear !== undefined && (edu.graduationYear < 1950 || edu.graduationYear > new Date().getFullYear() + 10)) {
                throw new ApiError(400, `Образование ${index + 1}: некорректный год выпуска`);
            }
        });
    }
    /**
     * Проверяет, требует ли изменение модерации
     */
    private checkIfModerationRequired(updateData: UpdateUserProfileDto): boolean {
        const criticalFields = ['specialization', 'education', 'placeWork','firstName', 'lastName'];

        return criticalFields.some(field =>
            updateData[field as keyof UpdateUserProfileDto] !== undefined
        );
    }
}
