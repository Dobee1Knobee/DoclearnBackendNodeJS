import { User, UserModel } from "@/models/User/User";
import mongoose from "mongoose";
import { ApiError } from "@/errors/ApiError";

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

export class UserRepository implements IUserRepository {

    async findByIdWithoutPassword(id: string): Promise<User | null> {
        try {
            return await UserModel.findById(id)
                .select('-password')
                .lean();
        } catch (error) {
            return null;
        }
    }

    async findByIdForProfile(id: string): Promise<User | null> {
        try {
            return await UserModel.findById(id)
                .select('firstName lastName email role placeWork stats isVerified createdAt')
                .lean();
        } catch (error) {
            return null;
        }
    }

    async findFollowers(userId: string): Promise<User[]> {
        try {
            return await UserModel.find({
                following: userId
            })
                .select('firstName lastName role stats isVerified createdAt')
                .lean();
        } catch (error) {
            return [];
        }
    }

    async findFollowing(userId: string): Promise<User[]> {
        try {
            const user = await UserModel.findById(userId).select('following').lean();
            if (!user?.following?.length) return [];

            return await UserModel.find({ _id: { $in: user.following } })
                .select('firstName lastName role stats isVerified createdAt')
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
        try {
            // Валидация входных параметров
            if (followerId === followingId) {
                throw new ApiError(400, "Нельзя подписаться на себя");
            }

            // Проверяем существование пользователей
            const follower = await UserModel.findById(followerId);
            const toFollow = await UserModel.findById(followingId);

            if (!follower || !toFollow) {
                throw new ApiError(404, "Пользователь не найден");
            }

            // Проверяем что ещё не подписан
            const alreadyFollowing = await this.isFollowing(followerId, followingId);
            if (alreadyFollowing) {
                throw new ApiError(400, "Вы уже подписаны на этого пользователя");
            }

            // Выполняем подписку в транзакции
            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    // Добавляем подписку
                    await UserModel.updateOne({
                        _id: followerId
                    }, {
                        $push: { following: followingId },
                        $inc: { "stats.followingCount": 1 }
                    }).session(session);

                    // Добавляем подписчика
                    await UserModel.updateOne({
                        _id: followingId
                    }, {
                        $push: { followers: followerId },
                        $inc: { "stats.followersCount": 1 }
                    }).session(session);
                });
            } finally {
                await session.endSession();
            }

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Ошибка при подписке");
        }
    }

    async unfollow(followerId: string, followingId: string): Promise<void> {
        try {
            // Валидация входных параметров
            if (followerId === followingId) {
                throw new ApiError(400, "Нельзя отписаться от себя");
            }

            // Проверяем существование пользователей
            const follower = await UserModel.findById(followerId);
            const toFollow = await UserModel.findById(followingId);

            if (!follower || !toFollow) {
                throw new ApiError(404, "Пользователь не найден");
            }

            // Проверяем что подписка существует
            const isFollowing = await this.isFollowing(followerId, followingId);
            if (!isFollowing) {
                throw new ApiError(400, "Вы не подписаны на этого пользователя");
            }

            // Выполняем отписку в транзакции
            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    // Убираем подписку
                    await UserModel.updateOne({
                        _id: followerId,
                    }, {
                        $pull: { following: followingId },
                        $inc: { "stats.followingCount": -1 }
                    }).session(session);

                    // Убираем подписчика
                    await UserModel.updateOne({
                        _id: followingId,
                    }, {
                        $pull: { followers: followerId },
                        $inc: { "stats.followersCount": -1 }
                    }).session(session);
                });
            } finally {
                await session.endSession();
            }

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Ошибка при отписке");
        }
    }
}