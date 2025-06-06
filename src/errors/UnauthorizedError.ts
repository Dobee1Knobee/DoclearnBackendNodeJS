// errors/UnauthorizedError.ts
import { ApiError } from "./ApiError";

export class UnauthorizedError extends ApiError {
    constructor(message = "Неверный код подтверждения") {
        super(401, message);
    }
}
