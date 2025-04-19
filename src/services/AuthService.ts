import {User} from "@/models/User";
import { RegisterDto } from "@/dto/RegisterDto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import * as process from "node:process";
import { users } from "../Data/users"; // 👈


export class AuthService {
    register(dto: RegisterDto): User {
        const existUser = users.find(u => u.email === dto.email);
        if (existUser) {
            throw new Error("User already exist");
        }

        const hashedPassword = bcrypt.hashSync(dto.password, 10);
        const newUser: User = {
            id: randomUUID(),
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            birthday: dto.birthday,
            role: "student",
            createdAt: new Date()
        };

        users.push(newUser);
        return newUser;
    }

    login(email: string, password: string): string {
        const user = users.find(u => u.email === email);
        if (!user) {
            throw new Error("User not found");
        }

        const isPasswordMatch = bcrypt.compareSync(password, user.password);
        if (!isPasswordMatch) {
            throw new Error("Password not match");
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "megatopsec",
            { expiresIn: "1d" }
        );

        return token;
    }
}