import pool from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';

export async function getUsers(): Promise<User[]> {
  const [rows] = await pool.query('SELECT * FROM users');
  const users = rows as User[];
  // Lấy vai trò cho từng user
  for (const user of users) {
    user.roles = await getUserRoles(user.id);
  }
  return users;
}

export async function getUserById(id: string): Promise<User | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  const user = (rows as User[])[0] || null;
  if (user) {
    user.roles = await getUserRoles(id);
  }
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = (rows as User[])[0] || null;
  if (user) {
    user.roles = await getUserRoles(user.id);
  }
  return user;
}

export async function createUser(user: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const { name, email, password } = user;
  const id = uuidv4();

  // Chèn user mới
  await pool.query(
    'INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [id, name, email, password]
  );

  // Gán vai trò "user" mặc định
  const role = await getRoleByName('user');
  if (!role) {
    throw new Error('Default role "user" not found');
  }
  await pool.query(
    'INSERT INTO role_user (user_id, role_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
    [id, role.id]
  );

  // Lấy user mới
  const newUser = await getUserByEmail(email);
  if (!newUser) {
    throw new Error('Failed to create user');
  }
  return newUser;
}

// Hàm phụ: Lấy danh sách vai trò của user
async function getUserRoles(userId: string): Promise<string[]> {
  const [rows] = await pool.query(
    'SELECT r.name FROM roles r JOIN role_user ru ON r.id = ru.role_id WHERE ru.user_id = ?',
    [userId]
  );
  return (rows as { name: string }[]).map(row => row.name);
}

// Hàm phụ: Lấy role theo tên
async function getRoleByName(name: string): Promise<{ id: string; name: string } | null> {
  const [rows] = await pool.query('SELECT id, name FROM roles WHERE name = ?', [name]);
  return (rows as { id: string; name: string }[])[0] || null;
}