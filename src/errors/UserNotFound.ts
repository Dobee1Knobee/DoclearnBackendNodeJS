import {ApiError} from "@/errors/ApiError";

export class UserNotFoundError extends ApiError {
    constructor(message = "Пользователь с таким email не найден ") {
        super(404, message);
    }
}