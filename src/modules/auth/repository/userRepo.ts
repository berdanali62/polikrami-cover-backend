import { prisma } from '../../../config/database';

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: { email: string; password: string; name?: string; role?: 'user' | 'designer' }) {
  const user = await prisma.user.create({ data: { email: data.email, password: data.password, name: data.name } });
  if (data.role && data.role !== 'user') {
    // basit: Role tablosunda 'designer' yoksa oluştur, sonra ilişkilendir (test amaçlı)
    const role = await prisma.role.upsert({ where: { name: data.role }, update: {}, create: { name: data.role } });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
  }
  return user;
}

