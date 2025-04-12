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
exports.getAllCategories = getAllCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
const prisma_1 = __importDefault(require("../database/prisma")); // Prisma Client
// Lấy danh sách tất cả các danh mục
function getAllCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.categories.findMany();
    });
}
// Tạo danh mục mới
function createCategory(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.categories.create({
            data,
        });
    });
}
// Cập nhật danh mục dựa vào ID
function updateCategory(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.categories.update({
            where: { id },
            data,
        });
    });
}
