import { User, UserModel, PendingChangesData } from "@/models/User/User";
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
    // Новый метод для частичного одобрения
    approveSpecificChanges(userId: string, fieldsToApprove: string[], moderatorData: {
        moderatorId: string;
        moderatorComment?: string;
    }): Promise<void>;
}

// Helper функция для извлечения values из новой структуры pendingChanges
function extractApprovedValues(pendingData: PendingChangesData): any {
    const result: any = {};
    for (const [field, data] of Object.entries(pendingData)) {
        if (data && typeof data === 'object' && 'value' in data && 'status' in data) {
            if (data.status === 'approved') {
                result[field] = data.value;
            }
        }
    }
    return result;
}

// Helper функция для извлечения конкретных полей
function extractSpecificFieldValues(pendingData: PendingChangesData, fieldsToApprove: string[]): any {
    const result: any = {};
    for (const field of fieldsToApprove) {
        if (pendingData[field] && typeof pendingData[field] === 'object' && 'value' in pendingData[field]) {
            result[field] = pendingData[field].value;
        }
    }
    return result;
}

// Helper функция для проверки глобального статуса
function calculateGlobalStatus(pendingData: PendingChangesData): 'pending' | 'approved' | 'rejected' | 'partial' {
    const statuses = Object.values(pendingData)
        .filter(item => item && typeof item === 'object' && 'status' in item)
        .map(item => item.status);

    if (statuses.length === 0) return 'pending';

    const uniqueStatuses = [...new Set(statuses)];

    if (uniqueStatuses.length === 1) {
        return uniqueStatuses[0] as 'pending' | 'approved' | 'rejected';
    } else {
        return 'partial';
    }
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
                'pendingChanges.globalStatus': 'pending'
            }).lean();
            return user as User | null;
        } catch (error) {
            return null;
        }
    }

    // Старый метод - теперь одобряет ВСЕ изменения
    async approveUserChanges(userId: string, changes: any, moderatorData: {
        moderatorId: string;
        moderatorComment?: string;
    }): Promise<void> {
        try {
            // Извлекаем все values из новой структуры
            const approvedValues = extractApprovedValues(changes);

            await UserModel.findByIdAndUpdate(userId, {
                ...approvedValues,
                'pendingChanges.globalStatus': 'approved',
                'pendingChanges.moderatorId': moderatorData.moderatorId,
                'pendingChanges.moderatedAt': new Date(),
                'pendingChanges.moderatorComment': moderatorData.moderatorComment
            });
        } catch (error) {
            throw new ApiError(500, "Ошибка при одобрении изменений");
        }
    }

    // Новый метод - одобряет только конкретные поля
    async approveSpecificChanges(userId: string, fieldsToApprove: string[], moderatorData: {
        moderatorId: string;
        moderatorComment?: string;
    }): Promise<void> {
        try {
            // Получаем пользователя с pending changes
            const user = await UserModel.findById(userId);
            if (!user || !user.pendingChanges?.data) {
                throw new ApiError(404, "Пользователь или изменения не найдены");
            }
            const oldData = user.pendingChanges?.data;

            // Извлекаем values только для указанных полей
            const approvedValues = extractSpecificFieldValues(user.pendingChanges.data, fieldsToApprove);

            // Обновляем статус конкретных полей на 'approved'
            const updateData: any = {
                ...oldData,
                ...approvedValues,
                'pendingChanges.moderatorId': moderatorData.moderatorId,
                'pendingChanges.moderatedAt': new Date(),
                'pendingChanges.moderatorComment': moderatorData.moderatorComment
            };

            // Обновляем статус полей в pendingChanges.data
            for (const field of fieldsToApprove) {
                updateData[`pendingChanges.data.${field}.status`] = 'approved';
            }

            // Вычисляем новый глобальный статус
            const updatedPendingData = { ...user.pendingChanges.data };
            for (const field of fieldsToApprove) {
                if (updatedPendingData[field]) {
                    updatedPendingData[field].status = 'approved';
                }
            }

            const newGlobalStatus = calculateGlobalStatus(updatedPendingData);
            updateData['pendingChanges.globalStatus'] = newGlobalStatus;

            await UserModel.findByIdAndUpdate(userId, updateData);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, "Ошибка при частичном одобрении изменений");
        }
    }

    async rejectUserChanges(userId: string, moderatorData: {
        moderatorId: string;
        moderatorComment: string;
    }): Promise<void> {
        try {
            await UserModel.findByIdAndUpdate(userId, {
                'pendingChanges.globalStatus': 'rejected',
                'pendingChanges.moderatorId': moderatorData.moderatorId,
                'pendingChanges.moderatedAt': new Date(),
                'pendingChanges.moderatorComment': moderatorData.moderatorComment
            });
        } catch (error) {
            throw new ApiError(500, "Ошибка при отклонении изменений");
        }
    }
}