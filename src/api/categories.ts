import { IncomingMessage, ServerResponse } from "http";
import { getAllCategories, createCategory, updateCategory } from "../services/categoriesService";

export async function handleCategoriesApi(req: IncomingMessage, res: ServerResponse) {
  const { method, url } = req;

  // GET /api/categories: Lấy danh sách tất cả danh mục
  if (method === "GET" && url === "/api/categories") {
    const categories = await getAllCategories();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(categories));
  }
  // POST /api/categories: Tạo danh mục mới
  else if (method === "POST" && url === "/api/categories") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      const data = JSON.parse(body);
      const newCategory = await createCategory(data);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newCategory));
    });
  }
  // PUT /api/categories/:id: Cập nhật danh mục theo ID
  else if (method === "PUT" && url?.startsWith("/api/categories/")) {
    const id = url.split("/")[3]; // Extract ID từ URL
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      const data = JSON.parse(body);
      const updatedCategory = await updateCategory(id, data);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updatedCategory));
    });
  }
  // Route không tồn tại
  else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Route not found");
  }
}
