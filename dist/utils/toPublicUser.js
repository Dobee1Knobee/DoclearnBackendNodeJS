"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUser = toPublicUser;
function toPublicUser(user) {
    const { password, ...rest } = user;
    return rest;
}
