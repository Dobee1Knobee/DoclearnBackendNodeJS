import { User, UserModel } from "@/models/User/User";
import { ApiError } from "@/errors/ApiError";
import { UserDto } from "@/dto/UserDto";
import { mapUserToPublicDto } from "@/utils/toPublicUser";

export interface IAdminRepository {
    findUserById(userId: string): Promise<User | null>;
    banUser(userId: string, banData: {
        banReason: string;
        bannedBy: string;
        bannedAt: Date;
    }): Promise<void>;
    unbanUser(userId: string): Promise<void>;
    updateUser(userId: string, updateData: any): Promise<User | null>;
    getAllUsers(query: any, skip: number, limit: number): Promise<{ users: User[], total: number }>;
    getUsersPendingChanges(query: any, skip: number, limit: number): Promise<{ users: User[], total: number }>;
    addWarning(userId: string, warning: {
        message: string;
        issuedBy: string;
        reason?: string;
    }): Promise<void>;
    getUserWithPendingChanges(userId: string): Promise<User | null>;
    approveUserChanges(userId: string, changes: any, moderatorData: {
        moderatorId: string;
        moderatorComment?: string;
    }): Promise<void>;
    rejectUserChanges(userId: string, moderatorData: {
        moderatorId: string;
        moderatorComment: string;
    }): Promise<void>;
}

export class AdminRepository implements IAdminRepository {


    async findUserById(userId: string): Promise<User | null> {
        try {
            const user = await UserModel.findById(userId)
                .select('-password')
                .lean();
            return user as User | null;
        } catch (error) {
            console.error("Database error in findUserById:", error);
            return null;
        }
    }

    async banUser(userId: string, banData: {
        banReason: string;
        bannedBy: string;
        bannedAt: Date;
    }): Promise<void> {
        try {
            await UserModel.findByIdAndUpdate(userId, {
                isBanned: true,
                banReason: banData.banReason,
                bannedAt: banData.bannedAt,
                bannedBy: banData.bannedBy
            });
        } catch (error) {
            throw new ApiError(500, "Ошибка при бане пользователя");
        }
    }

    async unbanUser(userId: string): Promise<void> {
        try {
            await UserModel.findByIdAndUpdate(userId, {
                $set: {
                    isBanned: false
                },
                $unset: {
                    banReason: "",
                    bannedAt: "",
                    bannedBy: ""
                }
            });
        } catch (error) {
            throw new ApiError(500, "Ошибка при разбане пользователя");
        }
    }
    async updateUser(userId: string, updateData: any): Promise<User | null> {
        try {
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            ).select('-password').lean();

            return updatedUser as User | null;
        } catch (error) {
            throw new ApiError(500, "Ошибка при обновлении пользователя");
        }
    }

    async getAllUsers(query: any, skip: number, limit: number): Promise<{
        users: User[];
        total: number;
    }> {
        try {
            const [users, total] = await Promise.all([
                UserModel.find(query)
                    .select('-password')
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 })
                    .lean(),
                UserModel.countDocuments(query)
            ]);

            return {
                users: users as User[],
                total
            };
        } catch (error) {
            throw new ApiError(500, "Ошибка при получении списка пользователей");
        }
    }

    async getUsersPendingChanges(query: any, skip: number, limit: number): Promise<{
        users: User[];
        total: number;
    }> {
        try {
            const [users, total] = await Promise.all([
                UserModel.find(query)
                    .select('-password')
                    .skip(skip)
                    .limit(limit)
                    .sort({ 'pendingChanges.submittedAt': -1 })
                    .lean(),
                UserModel.countDocuments(query)
            ]);

            return {
                users: users as User[],
                total
            };
        } catch (error) {
            throw new ApiError(500, "Ошибка при получении пользователей с ожидающими изменениями");
        }
    }

    async addWarning(userId: string, warning: {
        message: string;
        issuedBy: string;
        reason?: string;
    }): Promise<void> {
        try {
            await UserModel.findByIdAndUpdate(userId, {
                $push: {
                    warnings: {
                        message: warning.message,
                        issuedBy: warning.issuedBy,
                        issuedAt: new Date(),
                        reason: warning.reason
                    }
                }
            });
        } catch (error) {
            throw new ApiError(500, "Ошибка при добавлении предупреждения");
        }
    }

    async getUserWithPendingChanges(userId: string): Promise<User | null> {
        try {
            const user = await UserModel.findOne({
                _id: userId,
                'pendingChanges.status': 'pending'
            }).lean();
            return user as User | null;
        } catch (error) {
            return null;
        }
    }

    async approveUserChanges(userId: string, changes: any, moderatorData: {
        moderatorId: string;
        moderatorComment?: string;
    }): Promise<void> {
        try {
            await UserModel.findByIdAndUpdate(userId, {
                ...changes,
                'pendingChanges.status': 'approved',
                'pendingChanges.moderatorId': moderatorData.moderatorId,
                'pendingChanges.moderatedAt': new Date(),
                'pendingChanges.moderatorComment': moderatorData.moderatorComment
            });
        } catch (error) {
            throw new ApiError(500, "Ошибка при одобрении изменений");
        }
    }

    async rejectUserChanges(userId: string, moderatorData: {
        moderatorId: string;
        moderatorComment: string;
    }): Promise<void> {
        try {
            await UserModel.findByIdAndUpdate(userId, {
                'pendingChanges.status': 'rejected',
                'pendingChanges.moderatorId': moderatorData.moderatorId,
                'pendingChanges.moderatedAt': new Date(),
                'pendingChanges.moderatorComment': moderatorData.moderatorComment
            });
        } catch (error) {
            throw new ApiError(500, "Ошибка при отклонении изменений");
        }
    }
}