"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const process = __importStar(require("node:process"));
const EmailService_1 = require("./EmailService");
const toPublicUser_1 = require("@/utils/toPublicUser");
// Временное хранилище кодов подтверждения
const verificationCodes = new Map();
const User_1 = require("@/models/User");
class AuthService {
    async register(dto) {
        const existUser = await User_1.UserModel.findOne({ email: dto.email }).lean();
        if (existUser) {
            throw new Error("User already exists");
        }
        const hashedPassword = bcryptjs_1.default.hashSync(dto.password, 10);
        const newUser = await User_1.UserModel.create({
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            birthday: dto.birthday,
            role: "student",
            placeWork: dto.placeWork,
            isVerified: false,
        });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes.set(dto.email, code);
        await new EmailService_1.EmailService().sendMail(dto.email, "Код подтверждения аккаунта Doclearn", `Ваш код: ${code}`);
        return (0, toPublicUser_1.toPublicUser)(newUser.toObject());
    }
    async login(email, password) {
        // Явно указываем тип HydratedDocument<User>
        const user = await User_1.UserModel.findOne({ email }).exec();
        if (!user || !bcryptjs_1.default.compareSync(password, user.password)) {
            throw new Error("Неверный логин или пароль");
        }
        if (!user.isVerified) {
            throw new Error("Пользователь не верифицирован");
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id.toString(),
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET || "megatopsec", { expiresIn: "1d" });
        return {
            token,
            user: (0, toPublicUser_1.toPublicUser)(user.toObject())
        };
    }
    async verifyCode(email, code) {
        const saved = verificationCodes.get(email);
        if (saved !== code)
            return false;
        const user = await User_1.UserModel.findOneAndUpdate({ email }, { isVerified: true }, { new: true }).exec();
        verificationCodes.delete(email);
        return !!user;
    }
}
exports.AuthService = AuthService;
