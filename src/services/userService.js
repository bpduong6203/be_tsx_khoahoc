"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
const prisma_1 = __importDefault(require("../database/prisma"));
function getUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.users.findMany({
            include: {
                role_user: true, // Bao gồm role của user nếu cần
            },
        });
    });
}
function createUser(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.users.create({
            data,
        });
    });
}
function updateUser(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.users.update({
            where: { id },
            data,
        });
    });
}
