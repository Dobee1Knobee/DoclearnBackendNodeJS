import { Request, Response } from "express";
import {AuthService} from "@/services/AuthService";

const authService = new AuthService();

export class AuthController {
    register(req: Request, res: Response) {
        try {
            const user = authService.register(req.body);
            res.status(201).json(user);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }
    login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const token = authService.login(email, password);

            res.status(200).json({ token });
        } catch (err: any) {
            res.status(401).json({ error: err.message });
        }
    }

}


