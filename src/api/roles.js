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
exports.handleRolesApi = handleRolesApi;
const roleService_1 = require("../services/roleService");
function handleRolesApi(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (req.method === 'GET') {
            const roles = yield (0, roleService_1.getRoles)();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(roles));
        }
        else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => (body += chunk));
            req.on('end', () => __awaiter(this, void 0, void 0, function* () {
                const data = JSON.parse(body);
                const newRole = yield (0, roleService_1.createRole)(data);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newRole));
            }));
        }
        else if (req.method === 'PUT') {
            const id = (_a = req.url) === null || _a === void 0 ? void 0 : _a.split('/')[3]; // Extract ID từ URL
            let body = '';
            req.on('data', chunk => (body += chunk));
            req.on('end', () => __awaiter(this, void 0, void 0, function* () {
                const data = JSON.parse(body);
                if (id) {
                    const updatedRole = yield (0, roleService_1.updateRole)(id, data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(updatedRole));
                }
                else {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('ID is missing');
                }
            }));
        }
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Route not found');
        }
    });
}
