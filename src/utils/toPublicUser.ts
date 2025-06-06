import { User, PublicUser } from "@/models/User/User";

export function toPublicUser(user: User): PublicUser {
    const { password, ...rest } = user;
    return rest;
}