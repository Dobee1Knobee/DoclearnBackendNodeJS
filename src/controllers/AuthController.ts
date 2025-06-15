import { Request, Response, NextFunction } from "express";
import { AuthService } from "@/services/AuthService";

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            res.clearCookie("token");

            const user = await authService.register(req.body);
            res.status(201).json(user);
        } catch (err) {
            next(err); // 👈 пробрасываем ошибку в errorHandler
        }
    }


    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.cookie("token", result.token, { httpOnly: true });
            res.status(200).json(result.user);
        } catch (err) {
            next(err);
        }
    }

    async verify(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, code } = req.body;
            const isValid = await authService.verifyCode(email, code);

            if (!isValid) {
                return res.status(401).json({ error: "Неверный код подтверждения" });
            }

            return res.status(200).json({ message: "Email подтвержден и пользователь активирован" });
        } catch (err) {
            next(err);
        }
    }
    async validateResetToken(req: Request, res: Response, next: NextFunction): Promise<void>  {
        try {
            const  token  = req.cookies.token;

            if (!token) {
                res.status(400).json({ error: "Токен обязателен" });
                return;
            }

            const isValid = await authService.validatePasswordResetToken(token);

            if (!isValid) {
             res.status(400).json({ error: "Токен недействителен или истек" });
                return;
            }

            res.status(200).json({ message: "Токен действителен" });

        } catch (err) {
            next(err);
        }
    }


    async requestPasswordReset(req:Request,res:Response,next:NextFunction): Promise<void>  {
        try {
            const {email} = req.body;
            if (!email ) {
                res.status(400).json({error:"Email обязателен"});
                return
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({error:"Email некорректный"});
                return
            }
            await authService.createPasswordResetToken(email,res);
            res.status(200).json({
                message: "Если аккаунт с таким email существует, на него отправлена ссылка для сброса пароля"
            });
        }catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>  {
        try {
            const {token,newPassword} = req.body;
            if (!token || !newPassword) {
                 res.status(400).json({error:"Токен и новый пароль - обязательны"});
                return
            }
            await authService.resetPasswordResetToken(token,newPassword);
            res.status(200).json({message:"Пароль успешно изменен"})
        }catch (error) {
            next(error);
        }
    }
}
