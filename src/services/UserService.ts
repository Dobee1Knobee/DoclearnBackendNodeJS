import { User, UserModel } from "@/models/User/User";
import mongoose from "mongoose";
import { ApiError } from "@/errors/ApiError";
import { UserDto } from "@/dto/UserDto";
import { FileModel } from '@/models/File/File';

import { mapUserToPublicDto } from "@/utils/toPublicUser";
import {IUserRepository, UserRepository} from "@/repositories /UserRepository";
import {UpdateUserProfileDto} from "@/dto/UpdateUserProfile";
import FileUploadService from "@/services/FileUploadService";

export class UserService {
    private userRepository: IUserRepository;
    private fileService: FileUploadService;

    constructor(userRepository?: IUserRepository) {
        this.userRepository = userRepository || new UserRepository();
        this.fileService = new FileUploadService();
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

    private async getAvatarUrl(avatarId: string): Promise<string | null> {
        if(!avatarId) return null;

        const avatarFile = await FileModel.findById(avatarId);
        if(avatarFile){
            return await this.fileService.getSignedUrl(avatarFile.fileName, 'avatar');
        }

        return null;
    }
    private async getDocumentUrl(documentId: string): Promise<string | null> {
        if(!documentId) return null;

        const documentFile = await FileModel.findById(documentId);
        if(documentFile){
            return await this.fileService.getSignedUrl(documentFile.fileName, 'documentProfile');
        }

        return null;
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
            const userWithAvatar = mapUserToPublicDto(result);
            if (result.avatarId) {
                const avatarUrl = await this.getAvatarUrl(result.avatarId._id.toString());
                userWithAvatar.avatarUrl = avatarUrl || undefined;
            }


            return userWithAvatar;
        } catch (error) {
            this.handleError(error, "Ошибка при получении профиля пользователя");
        }
    }


    /**
     * Получить документы пользователя
     */
    async getDocuments(userId: string): Promise<void> {

    }

    /**
     * Получить список подписчиков пользователя
     */
    async getFollowers(userId: string): Promise<UserDto[]> {
        try {
            const userExists = await this.userRepository.findByIdForProfile(userId);
            if (!userExists) {
                throw new ApiError(404, "Пользователь не найден");
            }

            const followers = await this.userRepository.findFollowers(userId);

            // Promise.all для обработки всех аватарок параллельно
            const followersWithAvatars = await Promise.all(
                followers.map(async (user) => {
                    const userDto = mapUserToPublicDto(user);
                    if (user.avatarId) {
                        const avatarUrl = await this.getAvatarUrl(user.avatarId._id.toString());
                        userDto.avatarUrl = avatarUrl || undefined;
                    }
                    return userDto;
                })
            );

            return followersWithAvatars;
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
            const followingWithAvatars = await Promise.all(
                following.map(async (user) => {
                    const userDto = mapUserToPublicDto(user);
                    if (user.avatarId) {
                        const avatarUrl = await this.getAvatarUrl(user.avatarId._id.toString());
                        userDto.avatarUrl = avatarUrl || undefined;
                    }
                    return userDto;
                })
            );
            return followingWithAvatars;
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
                "isVerified.user": true // Показываем только верифицированных пользователей
            })
                .select('firstName lastName location experience rating bio email role placeWork contacts education stats isVerified avatarId middleName birthday defaultAvatarPath')
                .limit(limit)
                .lean();

            const usersRes = await Promise.all(users.map(async (user) => {
                const userDto = mapUserToPublicDto(user);
                if(user.avatarId){
                    const avatarUrl = await this.getAvatarUrl(user.avatarId._id.toString());
                    userDto.avatarUrl = avatarUrl || undefined;
                }
                return userDto;
            }));
            return usersRes;
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

    /**
     * Обновление профиля с разделением полей на модерируемые и немодерируемые
     */
    async updateUserProfile(userId: string, updateData: UpdateUserProfileDto): Promise<{
        message: string;
        requiresModeration: boolean;
        appliedImmediately?: string[];
        sentToModeration?: string[];
    }> {
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
            const oldData = user.pendingChanges?.data || {};

            // 4. Валидация данных
            this.validateUpdateData(updateData);

            // 5. Разделяем поля на модерируемые и немодерируемые
            const { fieldsForModeration, fieldsForImmediateUpdate } = this.separateFields(updateData);

            const results = {
                appliedImmediately: [] as string[],
                sentToModeration: [] as string[]
            };

            // 6. Обновляем немодерируемые поля сразу
            if (Object.keys(fieldsForImmediateUpdate).length > 0) {
                await UserModel.findByIdAndUpdate(
                    userId,
                    { ...fieldsForImmediateUpdate },
                    { new: true, runValidators: true }
                );
                results.appliedImmediately = Object.keys(fieldsForImmediateUpdate);
            }

            // 7. Отправляем модерируемые поля на модерацию (НОВАЯ СТРУКТУРА)
            if (Object.keys(fieldsForModeration).length > 0) {
                // Преобразуем в новую структуру данных
                const newFormatData: any = {};

                for (const [field, value] of Object.entries(fieldsForModeration)) {
                    newFormatData[field] = {
                        value: value,
                        status: 'pending'
                    };
                }


                await UserModel.findByIdAndUpdate(userId, {
                    pendingChanges: {
                        data: {...oldData,
                            ...newFormatData},           // ✅ Новая структура!
                        globalStatus: 'pending',       // ✅ Правильное поле!
                        submittedAt: new Date()
                    }
                });
                results.sentToModeration = Object.keys(fieldsForModeration);
            }

            // 8. Формируем ответ
            const hasModeration = results.sentToModeration.length > 0;
            const hasImmediate = results.appliedImmediately.length > 0;

            let message = "";
            if (hasModeration && hasImmediate) {
                message = `Часть изменений применена сразу (${results.appliedImmediately.join(', ')}), остальные отправлены на модерацию (${results.sentToModeration.join(', ')})`;
            } else if (hasModeration) {
                message = `Изменения отправлены на модерацию (${results.sentToModeration.join(', ')})`;
            } else {
                message = `Профиль успешно обновлен (${results.appliedImmediately.join(', ')})`;
            }

            return {
                message,
                requiresModeration: hasModeration,
                appliedImmediately: results.appliedImmediately,
                sentToModeration: results.sentToModeration
            };

        } catch (error) {
            this.handleError(error, "Ошибка при обновлении профиля");
        }
    }

    /**
     * Разделяет поля на те, что требуют модерации, и те, что можно обновить сразу
     */
    private separateFields(updateData: UpdateUserProfileDto): {
        fieldsForModeration: Partial<UpdateUserProfileDto>;
        fieldsForImmediateUpdate: Partial<UpdateUserProfileDto>;
    } {
        const moderationFields: (keyof UpdateUserProfileDto)[] = [
            'specialization', 'education', 'placeWork', 'firstName', 'lastName',"middleName"
        ];
        const immediateFields: (keyof UpdateUserProfileDto)[] = [
            'location', 'experience', 'bio', 'avatar', 'contacts',"birthday","defaultAvatarPath"
        ];

        const filterByFields = (fields: (keyof UpdateUserProfileDto)[]) =>
            Object.fromEntries(
                Object.entries(updateData).filter(([key]) =>
                    fields.includes(key as keyof UpdateUserProfileDto)
                )
            ) as Partial<UpdateUserProfileDto>;

        return {
            fieldsForModeration: filterByFields(moderationFields),
            fieldsForImmediateUpdate: filterByFields(immediateFields)
        };
    }

    /**
     * Проверяет, что в запросе только допустимые поля
     */
    private validateAllowedFields(updateData: any): void {
        const allowedFields = [
            'firstName', 'lastName', 'location', 'experience',
            'bio', 'placeWork', 'specialization', 'avatar',
            'contacts', 'education','birthday','defaultAvatarPath','middleName'
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

    async uploadEducationDocs(userId: string, file: any, educationId: string): Promise<{message: string}> {
        try {
            // 1. Загружаем файл
            const uploadResult = await this.fileService.uploadFile(file, "document", userId);
            const fileRecord = await FileModel.create({
                fileName: uploadResult.fileName,
                originalName: file.originalname,
                fileType: "document",
                userId: userId,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date(),
            });

            // 2. Добавляем документ в основное образование
            const result = await UserModel.findOneAndUpdate({
                _id: userId,
                "education._id": educationId,
            }, {
                $push: { "education.$.documentsId": fileRecord._id }
            });

            // if (!result) {
            //     throw new ApiError(404, "Образование не найдено");
            // }

            // 3. Добавляем документ в pendingChanges для модерации
            await this.addDocumentToPendingChanges(userId, educationId, fileRecord._id);

            return { message: "Диплом успешно загружен и отправлен на модерацию" };

        } catch (error) {
            this.handleError(error, "Ошибка при загрузке диплома");
        }
    }

    /**
     * Добавляет документ в pendingChanges для модерации (ОБНОВЛЕНО ДЛЯ НОВОЙ СТРУКТУРЫ)
     */
    private async addDocumentToPendingChanges(userId: string, educationId: string, fileId: any): Promise<void> {
        // Получаем текущего пользователя как plain object
        const user = await UserModel.findById(userId).lean();
        if (!user) {
            throw new ApiError(404, "Пользователь не найден");
        }

        // Проверяем, есть ли уже pendingChanges в новой структуре
        const currentPendingChanges = user.pendingChanges?.data?.education;
        let educationForModeration: any[];

        if (currentPendingChanges && typeof currentPendingChanges === 'object' && 'value' in currentPendingChanges) {
            // Новая структура: education: { value: [...], status: "pending" }
            educationForModeration = currentPendingChanges.value || [];
        } else if (Array.isArray(currentPendingChanges)) {
            // Старая структура: education: [...]
            educationForModeration = currentPendingChanges;
        } else {
            // Нет данных
            educationForModeration = [];
        }

        // Ищем существующую запись для этого образования
        const existingEducationIndex = educationForModeration.findIndex(
            (edu: any) => edu.originalEducationId === educationId
        );

        if (existingEducationIndex !== -1) {
            // Если запись уже есть - добавляем документ к существующим
            const existingEducation = educationForModeration[existingEducationIndex];
            educationForModeration[existingEducationIndex] = {
                originalEducationId: educationId,
                documentsId: [
                    ...(existingEducation.documentsId || []),
                    fileId
                ]
            };
        } else {
            // Если записи нет - создаем новую
            educationForModeration.push({
                originalEducationId: educationId,
                documentsId: [fileId]
            });
        }

        // Обновляем pendingChanges в новой структуре
        const updateData: any = {
            'pendingChanges.globalStatus': 'pending',  // ✅ Исправлено!
            'pendingChanges.submittedAt': new Date()
        };

        // Если у пользователя еще нет pendingChanges.data, создаем его
        if (!user.pendingChanges?.data) {
            updateData['pendingChanges.data'] = {
                education: {
                    value: educationForModeration,
                    status: 'pending'
                }
            };
        } else {
            updateData['pendingChanges.data.education'] = {
                value: educationForModeration,
                status: 'pending'
            };
        }

        await UserModel.findByIdAndUpdate(userId, updateData);
    }

    /**
     * Загрузка аватара пользователя
     */
    async uploadAvatar(userId: string, file: any): Promise<{ message: string; avatarUrl: string }> {
        try {
            const uploadResult = await this.fileService.uploadFile(file, "avatar", userId);
            const fileRecord = await FileModel.create({
                fileName: uploadResult.fileName,
                originalName: file.originalname,
                fileType: "avatar",
                userId: userId,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date(),
            });

            await UserModel.findByIdAndUpdate(userId, {
                avatarId: fileRecord._id,
                defaultAvatarPath:""
            });

            const avatarUrl = await this.fileService.getSignedUrl(fileRecord.fileName, "avatar");
            return { message: "Аватар успешно обновлен", avatarUrl };
        } catch (error) {
            this.handleError(error, "Ошибка при загрузке аватара");
        }
    }
    async uploadDocumentsToProfile(
        userId: string,
        file: any,
        category: string = 'other',
        label?: string,
        isPublic: boolean = true
    ): Promise<{ message: string }> {
        try {
            const uploadResult = await this.fileService.uploadFile(file, "documentProfile", userId);

            const fileRecord = await FileModel.create({
                fileName: uploadResult.fileName,
                originalName: file.originalname,
                fileType: "documentProfile",
                userId: userId,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date(),
            });

            await UserModel.findByIdAndUpdate(userId, {
                $push: {
                    documents: {
                        file: fileRecord._id,
                        category,
                        label: label || '',
                        isPublic,
                        uploadedAt: new Date()
                    }
                }
            });

            return {   message: `Документы загружены в категорию: ${category} и они ${isPublic ? '' : 'не '}видны пользователям`};

        } catch (error) {
            this.handleError(error, "Ошибка при загрузке документов в профиль");
        }
    }
}