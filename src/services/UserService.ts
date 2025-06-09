import {User, UserModel} from "@/models/User/User";
import mongoose from "mongoose";
import {ApiError} from "@/errors/ApiError";

export class UserService {

    async getUser(userId: string): Promise<User | null> {
        const userIDToSearch = new mongoose.Types.ObjectId(userId);
        const result = await UserModel.findById(userIDToSearch);
        if(!result) {
            throw new ApiError(404,`Пользователь  ${userId} не найден`)
        }
        return result;
    }

    async getFollowers(userId: string): Promise<User[]> {
        const userIDToSearch = new mongoose.Types.ObjectId(userId);

        const followers = await UserModel.find({
            following: userIDToSearch
        });

        return followers;
    }

    async getFollowing(userId: string): Promise<User[] | null> {
        const userIDToSearch = new mongoose.Types.ObjectId(userId);
        const user = await UserModel.findById(userIDToSearch).populate<{ following: User[] }>('following');

        if (!user) return null;

        return user.following as User[];
    }


}