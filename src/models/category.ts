import pool from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  status: 'Active' | 'Inactive';
}

export async function getAllCategories(): Promise<Category[]> {
  const [rows] = await pool.query(
    'SELECT id, name, description, parent_id, status FROM categories WHERE status = ?',
    ['Active']
  );
  return rows as Category[];
}

export async function createCategory(category: {
  name: string;
  description?: string | null;
  parent_id?: string | null;
  created_by: string;
}): Promise<Category> {
  const { name, description, parent_id, created_by } = category;
  const id = uuidv4();

  await pool.query(
    'INSERT INTO categories (id, name, description, parent_id, created_by, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [id, name, description || null, parent_id || null, created_by, 'Active']
  );

  const [rows] = await pool.query('SELECT id, name, description, parent_id, status FROM categories WHERE id = ?', [id]);
  return (rows as Category[])[0];
}

export async function updateCategory(
  id: string,
  category: {
    name?: string;
    description?: string | null;
    parent_id?: string | null;
    status?: 'Active' | 'Inactive';
  }
): Promise<Category | null> {
  const { name, description, parent_id, status } = category;
  const updates: { [key: string]: any } = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (parent_id !== undefined) updates.parent_id = parent_id;
  if (status) updates.status = status;
  updates.updated_at = new Date();

  if (Object.keys(updates).length === 0) {
    return null;
  }

  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  await pool.query(`UPDATE categories SET ${fields} WHERE id = ?`, [...values, id]);

  const [rows] = await pool.query('SELECT id, name, description, parent_id, status FROM categories WHERE id = ?', [id]);
  return (rows as Category[])[0] || null;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const [rows] = await pool.query('SELECT id, name, description, parent_id, status FROM categories WHERE id = ?', [id]);
  return (rows as Category[])[0] || null;
}