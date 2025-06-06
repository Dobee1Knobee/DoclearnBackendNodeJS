import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/errors/ApiError";

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof ApiError) {
         res.status(err.statusCode).json({ error: err.message });
         return;
    }

    console.error("❌ Unexpected error:", err);
    res.status(500).json({ error: "Internal Server Error" });
    return;
};
