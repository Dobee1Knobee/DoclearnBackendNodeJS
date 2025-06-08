// src/errors/ApiError.ts
export class ApiError extends Error {
    statusCode: number;
    status: string | undefined;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
