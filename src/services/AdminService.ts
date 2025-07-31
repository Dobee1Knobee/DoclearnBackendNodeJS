import {AdminRepository, IAdminRepository} from "@/repositories /AdminRepository";
import {ApiError} from "@/errors/ApiError";
import {UserModel} from "@/models/User/User";
import {UserDto} from "@/dto/UserDto";
import {UserForAdminDto, mapUserForAdminModeration} from "@/dto/UserForAdminDto";
import {mapUserToPublicDto} from "@/utils/toPublicUser";

export class AdminService {
    private adminRepository: IAdminRepository;
    constructor(adminRepository?:IAdminRepository) {
        this.adminRepository = adminRepository||new AdminRepository();
    }

    async addWarning(userId: string, warning: {
        message: string;
        issuedBy: string;
        reason?: string;
    }): Promise<{message:string}>{
        try {
            if (userId === warning.issuedBy) {
                throw new ApiError(400, "Нельзя выдать предупреждение себе самому");
            }

            // Проверяем существование пользователя
            const user = await this.adminRepository.findUserById(userId);
            if (!user) {
                throw new ApiError(404, "Пользователь не найден");
            }

            // Добавляем предупреждение
            await this.adminRepository.addWarning(userId, warning);
            return { message: "Пользователь успешно получил предупреждение" };

        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, "Ошибка при добавлении предупреждения");
        }
    }
    async banUser(userId:string,adminId:string,reason:string):Promise<{ message:string } > {
        try {
            if(adminId === userId){
                throw new ApiError(400,"Нельзя забанить самого себя");
            }
            const user = await UserModel.findById(userId);
            if(!user){
                throw new ApiError(404,"Пользователь не найден")
            }
            if(user.isBanned){
                throw new ApiError(400,"Пользователь уже забанен")
            }
            if(user.role === "admin" ){
                throw new ApiError(400,"Вы не можете банить других админов")
            }
            if(user.role === "owner"){
                throw new ApiError(400,"Вы не можете забанить, того, кто вас породил")
            }
            await this.adminRepository.banUser(userId, {
                banReason: reason,
                bannedBy: adminId,
                bannedAt: new Date()
            });

            return { message: "Пользователь успешно забанен" };

        }catch(err){
            throw new ApiError(500,"Что-то пошло не так при бане юзера")
        }
    }
    async unbanUser(userId: string, adminId: string): Promise<{ message: string }> {
        try {
            const user = await this.adminRepository.findUserById(userId);
            if (!user) {
                throw new ApiError(404, "Пользователь не найден");
            }
            if(adminId === userId){
                throw new ApiError(400,"Нельзя разбанить самого себя");
            }
            if (!user.isBanned) {
                throw new ApiError(400, "Пользователь не забанен");
            }

            await this.adminRepository.unbanUser(userId);

            return { message: "Пользователь успешно разбанен" };

        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, "Ошибка при разбане пользователя");
        }
    }

    async getAllUsers(adminId: string, page: number = 1, limit: number = 20, filters?: {
        role?: string;
        isBanned?: boolean;
        isUserVerified?: boolean;
        isDoctorVerified?: boolean;

        search?: string;
    }): Promise<{
        users: UserDto[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        try {
            const query: any = {};

            // Применяем фильтры
            if (filters?.role) query.role = filters.role;
            if (filters?.isBanned !== undefined) query.isBanned = filters.isBanned;
            if (filters?.isUserVerified !== undefined) query['isVerified.user'] = filters.isUserVerified;
            if (filters?.isDoctorVerified !== undefined) query['isVerified.doctor'] = filters.isDoctorVerified;

            if (filters?.search) {
                query.$or = [
                    { firstName: { $regex: filters.search, $options: 'i' } },
                    { lastName: { $regex: filters.search, $options: 'i' } },
                    { email: { $regex: filters.search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const result = await this.adminRepository.getAllUsers(query, skip, limit);

            return {
                users: result.users.map(user => mapUserToPublicDto(user)),
                total: result.total,
                page,
                totalPages: Math.ceil(result.total / limit)
            };

        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, "Ошибка при получении списка пользователей");
        }
    }

    async getUsersPendingChanges(adminId: string, page: number = 1, limit: number = 20, filters?: {
        search?: string;
    }): Promise<{
        users: UserForAdminDto[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        try {
            const query: any = {
                'pendingChanges.globalStatus': 'pending'
            };

            // Добавляем поиск если указан
            if (filters?.search) {
                query.$or = [
                    { firstName: { $regex: filters.search, $options: 'i' } },
                    { lastName: { $regex: filters.search, $options: 'i' } },
                    { email: { $regex: filters.search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const result = await this.adminRepository.getUsersPendingChanges(query, skip, limit);

            return {
                users: result.users.map(user => mapUserForAdminModeration(user)),
                total: result.total,
                page,
                totalPages: Math.ceil(result.total / limit)
            };

        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, "Ошибка при получении пользователей с ожидающими изменениями");
        }
    }

    async editUser(adminId: string, userId: string, updateData: Partial<UserDto>): Promise<UserDto> {
        try {
            const user = await this.adminRepository.findUserById(userId);
            if (!user) {
                throw new ApiError(404, "Пользователь не найден");
            }

            // Админ может редактировать любые поля, кроме критичных
            const { _id, password, email, ...allowedUpdates } = updateData as any;

            const updatedUser = await this.adminRepository.updateUser(userId, allowedUpdates);

            if (!updatedUser) {
                throw new ApiError(404, "Пользователь не найден");
            }

            return mapUserToPublicDto(updatedUser);

        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, "Ошибка при редактировании пользователя");
        }
    }

    async approveUserChanges(adminId: string, userId: string, comment?: string): Promise<{ message: string }> {
        try {
            const user = await this.adminRepository.getUserWithPendingChanges(userId);
            if (!user) {
                throw new ApiError(404, "Нет ожидающих изменений для данного пользователя");
            }

            if (user.pendingChanges?.globalStatus !== 'pending') {
                throw new ApiError(400, "Изменения уже обработаны");
            }

            // Применяем изменения
            const changes = user.pendingChanges.data;
            await this.adminRepository.approveUserChanges(userId, changes, {
                moderatorId: adminId,
                moderatorComment: comment
            });

            return { message: "Изменения одобрены и применены" };

        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, "Ошибка при одобрении изменений");
        }
    }
    async rejectUserChanges(adminId: string, userId: string, comment: string): Promise<{ message: string }> {
        try {
            const user = await this.adminRepository.getUserWithPendingChanges(userId);
            if (!user) {
                throw new ApiError(404, "Нет ожидающих изменений для данного пользователя");
            }

            if (user.pendingChanges?.globalStatus !== 'pending') {
                throw new ApiError(400, "Изменения уже обработаны");
            }

            await this.adminRepository.rejectUserChanges(userId, {
                moderatorId: adminId,
                moderatorComment: comment
            });

            return { message: "Изменения отклонены" };

        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, "Ошибка при отклонении изменений");
        }
    }
    async approveSpecificFields(
        adminId: string,
        userId: string,
        fieldsToApprove: string[],
        comment?: string
    ): Promise<{ message: string }> {
        try {
            // 1. Валидация входных данных
            if (!fieldsToApprove || fieldsToApprove.length === 0) {
                throw new ApiError(400, "Не указаны поля для одобрения");
            }

            // 2. Получение пользователей
            const [user, admin] = await Promise.all([
                this.adminRepository.getUserWithPendingChanges(userId),
                this.adminRepository.findUserById(adminId)
            ]);

            // 3. Проверки существования
            if (!user) {
                throw new ApiError(404, "Пользователь с ожидающими изменениями не найден");
            }

            if (!admin) {
                throw new ApiError(404, "Админ не найден");
            }

            // 4. Проверка прав админа
            if (admin.role !== "admin" && admin.role !== "owner") {
                throw new ApiError(403, "Недостаточно прав для одобрения изменений");
            }

            // 5. Проверка состояния изменений
            if (user.pendingChanges?.globalStatus !== 'pending') {
                throw new ApiError(400, "Изменения уже обработаны");
            }

            // 6. Валидация полей для одобрения
            const pendingData = user.pendingChanges.data;
            if (!pendingData) {
                throw new ApiError(400, "Нет данных для одобрения");
            }

            // Проверяем, что все запрашиваемые поля существуют и имеют статус pending
            const invalidFields = fieldsToApprove.filter(field => {
                const fieldData = pendingData[field];
                return !fieldData ||
                    typeof fieldData !== 'object' ||
                    !('value' in fieldData) ||
                    !('status' in fieldData);
            });

            if (invalidFields.length > 0) {
                throw new ApiError(400, `Поля не найдены в ожидающих изменениях: ${invalidFields.join(', ')}`);
            }

            // Проверяем, что поля еще не обработаны
            const alreadyProcessedFields = fieldsToApprove.filter(field => {
                const fieldData = pendingData[field];
                return fieldData.status !== 'pending';
            });

            if (alreadyProcessedFields.length > 0) {
                throw new ApiError(400, `Поля уже обработаны: ${alreadyProcessedFields.join(', ')}`);
            }

            // 7. Вызов repository для одобрения конкретных полей
            await this.adminRepository.approveSpecificChanges(userId, fieldsToApprove, {
                moderatorId: adminId,
                moderatorComment: comment
            });

            // 8. Формирование ответа
            const approvedFieldsText = fieldsToApprove.join(', ');
            return {
                message: `Поля успешно одобрены: ${approvedFieldsText}`
            };

        } catch (error) {
            if (error instanceof ApiError) throw error;
            console.log(error);
            throw new ApiError(500, "Ошибка при частичном одобрении изменений ");
        }
    }
}
