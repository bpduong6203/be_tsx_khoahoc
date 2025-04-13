import { getCoursesByCategoryId } from '../models/course';
import { Category } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getCategories, getCategoryById, createCategory, updateCategory } from '../models/category';

export async function getAllCategories(): Promise<Category[]> {
  return getCategories('Active');
}

export async function getCategoryDetails(id: string): Promise<Category | null> {
  return getCategoryById(id);
}

export async function createNewCategory(category: {
  name: string;
  description?: string | null;
  parent_id?: string | null;
  created_by: string;
}): Promise<Category> {
  const id = uuidv4();
  if (!category.name.trim()) {
    throw new Error('Category name is required');
  }

  return createCategory({
    id,
    name: category.name,
    description: category.description,
    parent_id: category.parent_id,
    created_by: category.created_by,
    status: 'Active',
  });
}

export async function updateCategoryDetails(
  id: string,
  category: {
    name?: string;
    description?: string | null;
    parent_id?: string | null;
    status?: 'Active' | 'Inactive';
  }
): Promise<Category | null> {
  const updates: { [key: string]: any } = {};
  if (category.name) updates.name = category.name.trim();
  if (category.description !== undefined) updates.description = category.description;
  if (category.parent_id !== undefined) updates.parent_id = category.parent_id;
  if (category.status) updates.status = category.status;
  updates.updated_at = new Date();

  if (Object.keys(updates).length === 0) {
    return null;
  }

  return updateCategory(id, { ...updates, updated_at: new Date() });
}

export async function getAllCategoriesWithCourses(): Promise<Category[]> {
  const categories = await getCategories('Active');
  
  for (const category of categories) {
    category.courses = await getCoursesByCategoryId(category.id, 'Published');
  }

  return categories;
}