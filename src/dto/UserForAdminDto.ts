export interface UserForAdminDto {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    role?: string;
    pendingChanges: {
        status: 'pending' | 'approved' | 'rejected';
        submittedAt: Date;
        data: any; // Содержит изменения, которые ждут модерации
        moderatorComment?: string;
    };
}

// Функция для маппинга пользователя в AdminDTO для модерации
export function mapUserForAdminModeration(user: any): UserForAdminDto {
    return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        pendingChanges: user.pendingChanges
    };
}