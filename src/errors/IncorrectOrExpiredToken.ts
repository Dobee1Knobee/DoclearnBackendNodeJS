// errors/UnauthorizedError.ts
import { ApiError } from "./ApiError";

export class IncorrectOrExpiredTokenError extends ApiError {
    constructor(message = "Некорректный или истекший токен") {
        super(400, message); // ← Bad Request
    }
}
