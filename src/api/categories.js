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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCategoriesApi = handleCategoriesApi;
const categoriesService_1 = require("../services/categoriesService");
function handleCategoriesApi(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { method, url } = req;
        // GET /api/categories: Lấy danh sách tất cả danh mục
        if (method === "GET" && url === "/api/categories") {
            const categories = yield (0, categoriesService_1.getAllCategories)();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(categories));
        }
        // POST /api/categories: Tạo danh mục mới
        else if (method === "POST" && url === "/api/categories") {
            let body = "";
            req.on("data", chunk => (body += chunk));
            req.on("end", () => __awaiter(this, void 0, void 0, function* () {
                const data = JSON.parse(body);
                const newCategory = yield (0, categoriesService_1.createCategory)(data);
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify(newCategory));
            }));
        }
        // PUT /api/categories/:id: Cập nhật danh mục theo ID
        else if (method === "PUT" && (url === null || url === void 0 ? void 0 : url.startsWith("/api/categories/"))) {
            const id = url.split("/")[3]; // Extract ID từ URL
            let body = "";
            req.on("data", chunk => (body += chunk));
            req.on("end", () => __awaiter(this, void 0, void 0, function* () {
                const data = JSON.parse(body);
                const updatedCategory = yield (0, categoriesService_1.updateCategory)(id, data);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(updatedCategory));
            }));
        }
        // Route không tồn tại
        else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Route not found");
        }
    });
}
