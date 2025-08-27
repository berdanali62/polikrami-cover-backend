import { prisma } from '../../../config/database';
import { ProjectStatus, Prisma } from '@prisma/client';

export async function listProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: {
      status: { not: 'deleted' as ProjectStatus },
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProject(params: { ownerId: string; title: string; orgId?: string; meta?: Prisma.InputJsonValue }) {
  return prisma.project.create({ data: { ownerId: params.ownerId, orgId: params.orgId, title: params.title, meta: params.meta } });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({ where: { id } });
}

export async function updateProject(id: string, data: { title?: string; status?: ProjectStatus; meta?: Prisma.InputJsonValue | null }) {
  return prisma.project.update({
    where: { id },
    data: {
      title: data.title,
      status: data.status,
      meta: data.meta === null ? Prisma.DbNull : data.meta,
    },
  });
}

export async function softDeleteProject(id: string) {
  return prisma.project.update({ where: { id }, data: { status: 'deleted' as ProjectStatus } });
}

export async function addProjectMember(projectId: string, userId: string, role: string) {
  return prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    update: { role },
    create: { projectId, userId, role },
  });
}

export async function listProjectMembers(projectId: string) {
  return prisma.projectMember.findMany({ where: { projectId }, include: { user: true } });
}

export async function removeProjectMember(projectId: string, userId: string) {
  return prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
}

export async function getMemberRole(projectId: string, userId: string): Promise<string | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!project) return null;
  if (project.ownerId === userId) return 'owner';
  const membership = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } }, select: { role: true } });
  return membership?.role ?? null;
}


