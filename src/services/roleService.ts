import prisma from '../database/prisma';
import { Role } from '../models/roles';

export async function getRoles() {
  return await prisma.roles.findMany();
}

export async function createRole(data: Role) {
  return await prisma.roles.create({
    data,
  });
}

export async function updateRole(id: string, data: Partial<Role>) {
  return await prisma.roles.update({
    where: { id },
    data,
  });
}
