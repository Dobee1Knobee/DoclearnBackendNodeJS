import { User, UserModel } from "@/models/User/User";
import mongoose from "mongoose";
import { ApiError } from "@/errors/ApiError";
import { FileModel } from '@/models/File/File'; // ← ПРОВЕРЬ, есть ли эта строчка?

// ✅ Интерфейс с правильными типами
export interface IUserRepository {
    findByIdForProfile(id: string): Promise<User | null>;
    findByIdWithoutPassword(id: string): Promise<User | null>;

    // Работа с подписками
    findFollowers(userId: string): Promise<User[]>;
    findFollowing(userId: string): Promise<User[]>;
    isFollowing(followerId: string, followingId: string): Promise<boolean>;

    // Изменение подписок
    follow(followerId: string, followingId: string): Promise<void>;
    unfollow(followerId: string, followingId: string): Promise<void>;
}

// ✅ Класс без префикса I
export class UserRepository implements IUserRepository {

    async findByIdWithoutPassword(id: string): Promise<any | null> {
        try {
            return await UserModel.findById(id)
                .select('-password')
                .lean();
        } catch (error) {
            return null;
        }
    }

    async findByIdForProfile(id: string): Promise<any | null> {
        try {
            return await UserModel.findById(id)
                .select('firstName lastName location experience birthday specialization rating bio email role placeWork contacts education stats isVerified createdAt updatedAt avatarId defaultAvatarPath documents middleName') // добавили avatarId
                .select('-password') // исключаем пароль
                .populate('avatarId') // загружаем данные файла
                .lean();
        } catch (error) {
            return null;
        }
    }

    async findFollowers(userId: string): Promise<any[]> {
        try {
            return await UserModel.find({
                following: userId
            })
                .select('firstName lastName location experience specialization rating role contacts stats isVerified createdAt updatedAt')
                .select('-password')
                .lean();
        } catch (error) {
            return [];
        }
    }

    async findFollowing(userId: string): Promise<any[]> {
        try {
            const user = await UserModel.findById(userId).select('following').lean();
            if (!user?.following?.length) return [];

            return await UserModel.find({ _id: { $in: user.following } })
                .select('firstName lastName location experience rating role contacts stats isVerified createdAt updatedAt')
                .select('-password')
                .lean();
        } catch (error) {
            return [];
        }
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        try {
            const result = await UserModel.findOne({
                _id: followerId,
                following: followingId
            }).lean();

            return !!result;
        } catch (error) {
            return false;
        }
    }

    async follow(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) {
            throw new ApiError(400, "Нельзя подписаться на себя");
        }

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const followerUpdate = await UserModel.updateOne(
                    { _id: followerId },
                    {
                        $addToSet: { following: followingId }
                    }
                ).session(session);

                const followedUpdate = await UserModel.updateOne(
                    { _id: followingId },
                    {
                        $addToSet: { followers: followerId }
                    }
                ).session(session);

                // Обновим счётчики только если действительно добавилось
                if (followerUpdate.modifiedCount > 0 && followedUpdate.modifiedCount > 0) {
                    await UserModel.updateOne(
                        { _id: followerId },
                        { $inc: { "stats.followingCount": 1 } }
                    ).session(session);

                    await UserModel.updateOne(
                        { _id: followingId },
                        { $inc: { "stats.followersCount": 1 } }
                    ).session(session);
                }
            });
        } catch (error) {
            throw new ApiError(500, "Ошибка при подписке");
        } finally {
            await session.endSession();
        }
    }

    async unfollow(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) {
            throw new ApiError(400, "Нельзя отписаться от себя");
        }

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const followerUpdate = await UserModel.updateOne(
                    { _id: followerId },
                    {
                        $pull: { following: followingId }
                    }
                ).session(session);

                const followedUpdate = await UserModel.updateOne(
                    { _id: followingId },
                    {
                        $pull: { followers: followerId }
                    }
                ).session(session);

                if (followerUpdate.modifiedCount > 0 && followedUpdate.modifiedCount > 0) {
                    await UserModel.updateOne(
                        { _id: followerId },
                        { $inc: { "stats.followingCount": -1 } }
                    ).session(session);

                    await UserModel.updateOne(
                        { _id: followingId },
                        { $inc: { "stats.followersCount": -1 } }
                    ).session(session);
                }
            });
        } catch (error) {
            throw new ApiError(500, "Ошибка при отписке");
        } finally {
            await session.endSession();
        }
    }

}
