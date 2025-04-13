import pool from '../database/db';
import { User, Role } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function getAllUsers(): Promise<User[]> {
  const [userRows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.created_at, u.updated_at 
     FROM users u`
  );

  const users = (userRows as any[]).map(row => ({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    roles: [],
  })) as User[];

  for (const user of users) {
    const [roleRows] = await pool.query(
      `SELECT r.id, r.name 
       FROM roles r 
       JOIN role_user ur ON r.id = ur.role_id 
       WHERE ur.user_id = ?`,
      [user.id]
    );
    user.roles = (roleRows as any[]).map(row => ({
      id: row.id,
      name: row.name,
    })) as Role[];
  }

  return users;
}

export async function getUserById(id: string): Promise<User | null> {
  const [userRows] = await pool.query(
    `SELECT id, name, avatar,email, created_at, updated_at 
     FROM users WHERE id = ?`,
    [id]
  );
  const user = (userRows as any[])[0];
  if (!user) return null;

  const [roleRows] = await pool.query(
    `SELECT r.id, r.name 
     FROM roles r 
     JOIN role_user ur ON r.id = ur.role_id 
     WHERE ur.user_id = ?`,
    [id]
  );

  return {
    ...user,
    created_at: new Date(user.created_at),
    updated_at: new Date(user.updated_at),
    roles: (roleRows as any[]).map(row => ({
      id: row.id,
      name: row.name,
    })) as Role[],
  } as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [userRows] = await pool.query(
    `SELECT id, name, avatar, email, password, created_at, updated_at 
     FROM users WHERE email = ?`,
    [email]
  );
  const user = (userRows as any[])[0];
  if (!user) return null;

  const [roleRows] = await pool.query(
    `SELECT r.id, r.name 
     FROM roles r 
     JOIN role_user ur ON r.id = ur.role_id 
     WHERE ur.user_id = ?`,
    [user.id]
  );

  return {
    ...user,
    created_at: new Date(user.created_at),
    updated_at: new Date(user.updated_at),
    roles: (roleRows as any[]).map(row => ({
      id: row.id,
      name: row.name,
    })) as Role[],
  } as User;
}

export async function createUser(user: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const id = uuidv4();
  const { name, email, password } = user;

  await pool.query(
    `INSERT INTO users (id, name, email, password, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, email, password, new Date(), new Date()]
  );

  const [roleRows] = await pool.query(`SELECT id FROM roles WHERE name = ?`, ['user']);
  const role = (roleRows as any[])[0];
  if (role) {
    await pool.query(
      `INSERT INTO role_user (user_id, role_id) VALUES (?, ?)`,
      [id, role.id]
    );
  }

  const createdUser = await getUserByEmail(email);
  if (!createdUser) {
    throw new Error('Không thể tạo người dùng');
  }
  return createdUser;
}

export async function updateUser(
  id: string,
  updates: {
    name?: string;
    email?: string;
    password?: string;
    avatar?: string;
    updated_at: Date;
  }
): Promise<User | null> {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, [...values, id]);

  return await getUserById(id);
}