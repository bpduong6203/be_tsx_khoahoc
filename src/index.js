"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const categories_1 = require("./api/categories");
const server = http_1.default.createServer((req, res) => {
    var _a;
    if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith("/api/categories")) {
        (0, categories_1.handleCategoriesApi)(req, res);
    }
    else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
});
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
