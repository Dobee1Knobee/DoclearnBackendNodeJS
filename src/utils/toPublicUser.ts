// utils/userMapper.ts
import { User } from "@/models/User/User";
import { UserDto } from "@/dto/UserDto";

export function mapUserToPublicDto(user: User, isFollowing?: boolean): UserDto {
    return {
        id: (user as any).id || (user as any)._id?.toString() || '',  // ← возвращаем "id", не "_id"
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        birthday: user.birthday,
        placeWork: user.placeWork || undefined,
        role: user.role,
        following: user.following?.map(id => id.toString()) || [],
        followers: user.followers?.map(id => id.toString()) || [],
        stats: {
            followingCount: user.stats?.followingCount || 0,
            followersCount: user.stats?.followersCount || 0,
            postsCount: user.stats?.postsCount || 0
        },
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        isFollowing // ← опциональное поле для UI
    };
}

// Для массивов пользователей
export function mapUsersToPublicDto(users: User[]): UserDto[] {
    return users.map(user => mapUserToPublicDto(user));
}