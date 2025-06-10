import {User, UserModel} from "@/models/User/User";
import mongoose from "mongoose";
import {ApiError} from "@/errors/ApiError";
import {PublicUserDto} from "@/dto/PublicUserDto";

export class UserService {

    async getUserProfile(userId: string, currentUserId?: string): Promise<PublicUserDto> {
        try {
            const user = await UserModel.findById(userId)
                .select('-password')
                .lean();

            if (!user) {
                throw new ApiError(404, "Пользователь не найден");
            }

            let isFollowing = false;
            if (currentUserId && currentUserId !== userId) {
                try {
                    isFollowing = await this.isFollowing(currentUserId, userId);
                } catch (error) {
                    console.error("Ошибка проверки подписки:", error);
                    isFollowing = false;
                }
            }

            // Простое решение - spread все поля
            return {
                ...user,
                _id: user._id.toString(),
                following: user.following?.map(id => id.toString()) || [],
                followers: user.followers?.map(id => id.toString()) || [],
                isFollowing
            } as PublicUserDto;

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Ошибка при получении профиля пользователя");
        }
    }
    async getFollowers(userId: string): Promise<User[]> {
        const userIDToSearch = new mongoose.Types.ObjectId(userId);

        const followers = await UserModel.find({
            following: userIDToSearch
        }).select("-password");

        return followers;
    }
    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        try {
            const userFollowingId = new mongoose.Types.ObjectId(followingId);
            const userFollowerId = new mongoose.Types.ObjectId(followerId);

            const result = await UserModel.findOne({
                _id: userFollowerId,
                following: userFollowingId
            }).lean();

            return !!result;

        } catch (error) {
            return false;
        }
    }
    async getFollowing(userId: string): Promise<User[] | null> {
        const userIDToSearch = new mongoose.Types.ObjectId(userId);
        const user = await UserModel.findById(userIDToSearch).populate<{ following: User[] }>('following').select("-password");

        if (!user) return null;

        return user.following as User[];
    }


}