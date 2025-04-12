import prisma from '../database/prisma';
import { User } from '../models/users';

export async function getUsers() {
  return await prisma.users.findMany({
    include: {
      role_user: true, // Bao gồm role của user nếu cần
    },
  });
}

export async function createUser(data: User) {
  return await prisma.users.create({
    data,
  });
}

export async function updateUser(id: string, data: Partial<User>) {
  return await prisma.users.update({
    where: { id },
    data,
  });
}
