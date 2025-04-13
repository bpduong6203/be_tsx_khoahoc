import { getAllUsers, getUserById, updateUser } from '../models/user';
import { User } from '../types';
import bcrypt from 'bcrypt';
import pool from '../database/db';

export async function getAllUsersService(): Promise<User[]> {
  return getAllUsers();
}

export async function getUserDetails(userId: string): Promise<User | null> {
  return getUserById(userId);
}

export async function updateUserDetails(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    password?: string;
  }
): Promise<User | null> {
  const updateFields: {
    name?: string;
    email?: string;
    password?: string;
    updated_at: Date;
  } = {
    updated_at: new Date(),
  };

  if (updates.name) {
    updateFields.name = updates.name.trim();
    if (!updateFields.name) {
      throw new Error('Name is required');
    }
  }

  if (updates.email) {
    updateFields.email = updates.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateFields.email)) {
      throw new Error('Invalid email');
    }
    const [existing] = await pool.query(
      `SELECT id FROM users WHERE email = ? AND id != ?`,
      [updateFields.email, userId]
    );
    if ((existing as any[]).length > 0) {
      throw new Error('Email already in use');
    }
  }

  if (updates.password) {
    updateFields.password = await bcrypt.hash(updates.password, 10);
    if (updates.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
  }

  if (Object.keys(updateFields).length === 1) {
    return null;
  }

  const updatedUser = await updateUser(userId, updateFields);
  if (!updatedUser) {
    throw new Error('User not found');
  }

  return updatedUser;
}

export function formatUserForResponse(user: User): any {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map(role => role.name),
  };
}