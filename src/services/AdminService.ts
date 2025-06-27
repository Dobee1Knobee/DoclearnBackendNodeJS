import {AdminRepository, IAdminRepository} from "@/repositories /AdminRepository";
import {ApiError} from "@/errors/ApiError";
import {UserModel} from "@/models/User/User";
import {UserDto} from "@/dto/UserDto";
import {mapUserToPublicDto} from "@/utils/toPublicUser";

export class AdminService {
    private adminRepository: IAdminRepository;
    constructor(adminRepository?:IAdminRepository) {
        this.adminRepository = adminRepository||new AdminRepository();
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
        isVerified?: boolean;
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
            if (filters?.isVerified !== undefined) query['isVerified.user'] = filters.isVerified;

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

            if (user.pendingChanges?.status !== 'pending') {
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

            if (user.pendingChanges?.status !== 'pending') {
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
}