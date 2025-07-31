import { User, UserModel, PendingChangesData } from "@/models/User/User";
import { ApiError } from "@/errors/ApiError";
import { UserDto } from "@/dto/UserDto";
import { mapUserToPublicDto } from "@/utils/toPublicUser";
import mongoose from "mongoose";

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
    // findEducationById(userId: string,education:string): Promise<User | null>;
    getUserWithPendingChanges(userId: string): Promise<User | null>;
    approveUserChanges(userId: string, changes: any, moderatorData: {
        moderatorId: string;
        moderatorComment?: string;
    }): Promise<void>;
    rejectUserChanges(userId: string, moderatorData: {
        moderatorId: string;
        moderatorComment: string;
    }): Promise<void>;
    approveSpecificChanges(userId: string, fieldsToApprove: string[], moderatorData: {
        moderatorId: string;
        moderatorComment?: string;
    }): Promise<void>;
}

export class AdminRepository implements IAdminRepository {

    // ✅ Приватные методы класса
    private extractSpecificFieldValues(pendingData: PendingChangesData, fieldsToApprove: string[]): any {
        console.log('🔧 extractSpecificFieldValues called with:', {
            fieldsToApprove,
            pendingDataKeys: Object.keys(pendingData)
        });

        const result: any = {};

        for (const field of fieldsToApprove) {
            const fieldData = pendingData[field];

            if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                let extractedValue = fieldData.value;

                console.log(`📋 Processing field ${field}:`, {
                    originalValue: extractedValue,
                    valueType: typeof extractedValue,
                    isArray: Array.isArray(extractedValue)
                });

                // ✅ Специальная обработка для specializations
                if (field === 'specializations' && Array.isArray(extractedValue)) {
                    extractedValue = extractedValue.map(spec => {
                        const processedSpec = { ...spec };

                        console.log('🔍 Processing specialization:', spec);

                        // ✅ Исправляем method если он пришел как объект { type: 'Ординатура' }
                        if (processedSpec.method && typeof processedSpec.method === 'object') {
                            if ('type' in processedSpec.method) {
                                processedSpec.method = processedSpec.method.type;
                                console.log(`🔧 Fixed method from type: ${processedSpec.method}`);
                            } else if ('enum' in processedSpec.method) {
                                processedSpec.method = processedSpec.method.enum;
                                console.log(`🔧 Fixed method from enum: ${processedSpec.method}`);
                            }
                        }

                        // ✅ Исправляем qualificationCategory если он пришел как объект
                        if (processedSpec.qualificationCategory && typeof processedSpec.qualificationCategory === 'object') {
                            if ('type' in processedSpec.qualificationCategory) {
                                processedSpec.qualificationCategory = processedSpec.qualificationCategory.type;
                                console.log(`🔧 Fixed qualificationCategory from type: ${processedSpec.qualificationCategory}`);
                            } else if ('enum' in processedSpec.qualificationCategory) {
                                processedSpec.qualificationCategory = processedSpec.qualificationCategory.enum;
                                console.log(`🔧 Fixed qualificationCategory from enum: ${processedSpec.qualificationCategory}`);
                            }
                        }

                        // ✅ Убираем _id если он есть (так как _id: false в схеме)
                        if ('_id' in processedSpec) {
                            delete processedSpec._id;
                            console.log('🗑️  Removed _id from specialization');
                        }

                        // ✅ Проверяем обязательные поля
                        if (!processedSpec.specializationId) {
                            console.warn('⚠️  Missing specializationId in specialization:', processedSpec);
                        }
                        if (!processedSpec.method) {
                            console.warn('⚠️  Missing method in specialization:', processedSpec);
                        }
                        if (!processedSpec.qualificationCategory) {
                            console.warn('⚠️  Missing qualificationCategory in specialization:', processedSpec);
                        }
                        if (processedSpec.main === undefined || processedSpec.main === null) {
                            console.warn('⚠️  Missing main field in specialization:', processedSpec);
                        }

                        console.log(`✅ Final processed specialization:`, processedSpec);
                        return processedSpec;
                    });

                    console.log(`📊 All specializations processed:`, extractedValue);
                }

                // ✅ Общая обработка для других полей, которые могут быть объектами
                else if (extractedValue && typeof extractedValue === 'object' && !Array.isArray(extractedValue)) {
                    if ('type' in extractedValue) {
                        extractedValue = extractedValue.type;
                        console.log(`🔧 Fixed object field ${field} from type: ${extractedValue}`);
                    } else if ('enum' in extractedValue) {
                        extractedValue = extractedValue.enum;
                        console.log(`🔧 Fixed object field ${field} from enum: ${extractedValue}`);
                    }
                }

                result[field] = extractedValue;
                console.log(`✅ Final value for ${field}:`, JSON.stringify(extractedValue, null, 2));
            } else {
                console.log(`⚠️  Field ${field} has no valid value:`, fieldData);
            }
        }

        console.log('📊 Final extracted values:', JSON.stringify(result, null, 2));
        return result;
    }

    private calculateGlobalStatus(pendingData: PendingChangesData): 'pending' | 'approved' | 'rejected' | 'partial' | 'completed' {
        if (Object.keys(pendingData).length === 0) {
            return 'completed';
        }

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

    private extractApprovedValues(pendingData: PendingChangesData): any {
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

    // ✅ Остальные методы без изменений
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

    async approveUserChanges(userId: string, changes: any, moderatorData: {
        moderatorId: string;
        moderatorComment?: string;
    }): Promise<void> {
        try {
            const approvedValues = this.extractApprovedValues(changes);

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

    // ✅ ИСПРАВЛЕННЫЙ метод approveSpecificChanges
    // ✅ ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ метод approveSpecificChanges
    async approveSpecificChanges(userId: string, fieldsToApprove: string[], moderatorData: {
        moderatorId: string;
        moderatorComment?: string;
    }): Promise<void> {
        try {
            console.log('🏪 Repository: approveSpecificChanges started', {
                userId,
                fieldsToApprove,
                moderatorData
            });

            const user = await UserModel.findById(userId);
            if (!user || !user.pendingChanges?.data) {
                console.log('❌ Repository: User or pending changes not found');
                throw new ApiError(404, "Пользователь или изменения не найдены");
            }

            console.log('✅ Repository: User found', {
                userId: user._id,
                hasPendingChanges: !!user.pendingChanges,
                pendingDataKeys: user.pendingChanges?.data ? Object.keys(user.pendingChanges.data) : []
            });

            const currentPendingData = user.pendingChanges.data;

            // ✅ Используем this. для вызова методов класса
            console.log('🔄 Repository: Extracting approved values...');
            const approvedValues = this.extractSpecificFieldValues(currentPendingData, fieldsToApprove);
            console.log('📊 Repository: Approved values extracted:', approvedValues);

            // Формируем оставшиеся pending данные
            const remainingPendingData: any = {};
            Object.keys(currentPendingData).forEach(fieldName => {
                if (!fieldsToApprove.includes(fieldName)) {
                    remainingPendingData[fieldName] = currentPendingData[fieldName];
                }
            });

            console.log('📋 Repository: Remaining pending data:', {
                remainingKeys: Object.keys(remainingPendingData)
            });

            const newGlobalStatus = Object.keys(remainingPendingData).length > 0
                ? this.calculateGlobalStatus(remainingPendingData)
                : 'completed';

            console.log('📊 Repository: New global status:', newGlobalStatus);

            // ✅ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Применяем изменения к объекту user напрямую
            console.log('💾 Repository: Applying approved values to user object...');
            Object.assign(user, approvedValues);

            // ✅ Обновляем pendingChanges напрямую в объекте user
            console.log('🔄 Repository: Updating pending changes metadata...');
            user.pendingChanges.data = remainingPendingData;
            // @ts-ignore
            user.pendingChanges.globalStatus = newGlobalStatus;
            user.pendingChanges.moderatorId = new mongoose.Types.ObjectId(moderatorData.moderatorId);
            user.pendingChanges.moderatedAt = new Date();

            if (moderatorData.moderatorComment) {
                user.pendingChanges.moderatorComment = moderatorData.moderatorComment;
            }

            // Если больше нет pending данных, очищаем pendingChanges
            if (Object.keys(remainingPendingData).length === 0) {
                console.log('🗑️  Repository: Clearing pending changes (all approved)');
                user.pendingChanges = undefined;
            }

            // ✅ САМОЕ ВАЖНОЕ: Используем save() вместо findByIdAndUpdate()
            // Это запустит middleware, который заполнит specializations.name
            console.log('💾 Repository: Saving user with middleware execution...');
            await user.save();

            console.log('✅ Repository: User saved successfully with middleware execution');

        } catch (error) {
            console.error('💥 Repository error in approveSpecificChanges:', {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
            });

            if (error instanceof ApiError) throw error;
            const errorMessage = error instanceof Error ? error.message : 'Unknown repository error';
            throw new ApiError(500, `Ошибка в repository при частичном одобрении: ${errorMessage}`);
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
