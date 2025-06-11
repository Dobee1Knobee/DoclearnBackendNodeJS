import { UserService } from "@/services/UserService";
import { NextFunction, Request, Response } from "express";

const userService = new UserService();

export class UserController {
    async getMyProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const result = await userService.getUserProfile(id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

}
