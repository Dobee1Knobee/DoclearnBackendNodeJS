import { UserDto } from '../dto/UserDto'; // Импортируйте ваш интерфейс

export function mapUserToPublicDto(user: any, isFollowing?: boolean): UserDto {
    return {
        _id: (user as any)._id?.toString() || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName,
        documents: user.documents || [],
        defaultAvatarPath: user.defaultAvatarPath || '',
        location: user.location,
        experience: user.experience,
        rating: user.rating || 0,
        bio: user.bio,
        email: user.email || '',
        birthday: user.birthday || new Date(),
        placeWork: user.placeWork,
        placeStudy: user.placeStudy, // Добавлено новое поле
        scientificStatus: user.scientificStatus ? {
            degree: user.scientificStatus.degree || null,
            title: user.scientificStatus.title || null,
            rank: user.scientificStatus.rank || null,
            interests: user.scientificStatus.interests || []
        } : undefined, // Добавлено новое поле
        avatarId: user.avatarId || null,
        avatarUrl: user.avatarUrl || null,
        contacts: user.contacts || [],
        education: user.education || [],
        workHistory: user.workHistory, // Опциональное поле - может быть undefined
        specializations: user.specializations, // Опциональное поле - может быть undefined
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