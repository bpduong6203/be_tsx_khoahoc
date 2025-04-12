"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const categories_1 = require("./api/categories");
const users_1 = require("./api/users");
const roles_1 = require("./api/roles");
const server = http_1.default.createServer((req, res) => {
    var _a, _b, _c;
    if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith("/api/categories")) {
        (0, categories_1.handleCategoriesApi)(req, res);
    }
    else if ((_b = req.url) === null || _b === void 0 ? void 0 : _b.startsWith('/api/users')) {
        (0, users_1.handleUsersApi)(req, res);
    }
    else if ((_c = req.url) === null || _c === void 0 ? void 0 : _c.startsWith('/api/roles')) {
        (0, roles_1.handleRolesApi)(req, res);
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
