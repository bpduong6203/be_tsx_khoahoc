import prisma from "../database/prisma"; // Prisma Client
import { Category } from "../models/categories";

// Lấy danh sách tất cả các danh mục
export async function getAllCategories() {
  return await prisma.categories.findMany();
}

// Tạo danh mục mới
export async function createCategory(data: Category) {
  return await prisma.categories.create({
    data,
  });
}

// Cập nhật danh mục dựa vào ID
export async function updateCategory(id: string, data: Partial<Category>) {
  return await prisma.categories.update({
    where: { id },
    data,
  });
}

