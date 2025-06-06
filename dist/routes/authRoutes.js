"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("@/controllers/AuthController");
const router = (0, express_1.Router)();
const controller = new AuthController_1.AuthController();
router.post("/register", controller.register);
router.post("/login", controller.login);
// @ts-ignore
router.post("/verify-email", async (req, res) => {
    // @ts-ignore
    return controller.verify(req, res);
});
exports.default = router;
