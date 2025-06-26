import { UserDto } from "@/dto/UserDto";

export function mapUserToPublicDto(user: any, isFollowing?: boolean): UserDto {
    return {
        _id: (user as any)._id || (user as any)._id?.toString() || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        specialization: user.specialization || '',
        location: user.location || '',
        experience: user.experience || '',
        rating: user.rating || 0,
        bio: user.bio,
        email: user.email || '',
        birthday: user.birthday || new Date(),
        placeWork: user.placeWork,
        avatar: user.avatar || '',
        contacts: user.contacts || [],
        education: user.education || [],
        role: user.role || 'user',
        following: user.following?.map((id: any) => id.toString()) || [],
        followers: user.followers?.map((id: any) => id.toString()) || [],
        joinTo: user.joinTo || [],
        stats: {
            followingCount: user.stats?.followingCount || 0,
            followersCount: user.stats?.followersCount || 0,
            postsCount: user.stats?.postsCount || 0
        },
        isVerified: user.isVerified || false,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
        isFollowing
    };
}

// Для массивов пользователей
export function mapUsersToPublicDto(users: any[]): UserDto[] {
    return users.map(user => mapUserToPublicDto(user));
}