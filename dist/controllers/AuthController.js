"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("@/services/AuthService");
const authService = new AuthService_1.AuthService();
class AuthController {
    async register(req, res) {
        try {
            const user = await authService.register(req.body); // ✅ ждем результата
            res.status(201).json(user);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password); // ✅ await
            res.status(200).json(result);
        }
        catch (err) {
            res.status(401).json({ error: err.message });
        }
    }
    async verify(req, res) {
        try {
            const { email, code } = req.body;
            const isValid = await authService.verifyCode(email, code); // ✅ await
            if (!isValid) {
                return res.status(400).json({ error: "Неверный код подтверждения" });
            }
            return res.status(200).json({ message: "Email подтвержден и пользователь активирован" });
        }
        catch (err) {
            res.status(500).json({ error: "Ошибка на сервере" });
        }
    }
}
exports.AuthController = AuthController;
