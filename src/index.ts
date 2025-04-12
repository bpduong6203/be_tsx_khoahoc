import http from "http";
import { handleCategoriesApi } from "./api/categories";

const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/api/categories")) {
    handleCategoriesApi(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
