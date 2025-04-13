import pool from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import { Category } from '../types';

export async function getCategories(status: 'Active' | 'Inactive' | 'All' = 'Active'): Promise<Category[]> {
  const query = status === 'All'
    ? 'SELECT id, name, description, parent_id, status FROM categories'
    : 'SELECT id, name, description, parent_id, status FROM categories WHERE status = ?';
  const params = status === 'All' ? [] : [status];
  
  const [rows] = await pool.query(query, params);
  return rows as Category[];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const [rows] = await pool.query(
    'SELECT id, name, description, parent_id, status FROM categories WHERE id = ?',
    [id]
  );
  return (rows as Category[])[0] || null;
}

export async function createCategory(category: {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  created_by: string;
  status: 'Active' | 'Inactive';
}): Promise<Category> {
  const { id, name, description, parent_id, created_by, status } = category;
  await pool.query(
    'INSERT INTO categories (id, name, description, parent_id, created_by, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [id, name, description || null, parent_id || null, created_by, status]
  );

  const [rows] = await pool.query(
    'SELECT id, name, description, parent_id, status FROM categories WHERE id = ?',
    [id]
  );
  return (rows as Category[])[0];
}

export async function updateCategory(
  id: string,
  updates: {
    name?: string;
    description?: string | null;
    parent_id?: string | null;
    status?: 'Active' | 'Inactive';
    updated_at: Date;
  }
): Promise<Category | null> {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  await pool.query(`UPDATE categories SET ${fields} WHERE id = ?`, [...values, id]);

  const [rows] = await pool.query(
    'SELECT id, name, description, parent_id, status FROM categories WHERE id = ?',
    [id]
  );
  return (rows as Category[])[0] || null;
}