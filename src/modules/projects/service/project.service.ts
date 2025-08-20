import { ProjectStatus, type Prisma } from '@prisma/client';
import { forbidden, notFound } from '../../../shared/errors/ApiError';
import { addProjectMember, createProject, getMemberRole, getProject, listProjectMembers, listProjectsForUser, removeProjectMember, softDeleteProject, updateProject } from '../repository/projectRepo';

export class ProjectService {
  async list(userId: string) {
    return listProjectsForUser(userId);
  }

  async create(ownerId: string, params: { title: string; orgId?: string; meta?: Prisma.InputJsonValue }) {
    const project = await createProject({ ownerId, title: params.title, orgId: params.orgId, meta: params.meta });
    // owner'ı member olarak ekle
    await addProjectMember(project.id, ownerId, 'owner');
    return project;
  }

  async get(id: string, actorId?: string) {
    const p = await getProject(id);
    if (!p) throw notFound('Project not found');
    if (actorId) {
      const role = await getMemberRole(id, actorId);
      if (!role) throw forbidden('No access to project');
    }
    return p;
  }

  async update(id: string, data: { title?: string; status?: ProjectStatus; meta?: Prisma.InputJsonValue | null }, actorId?: string) {
    if (actorId) {
      const role = await getMemberRole(id, actorId);
      if (!role) throw forbidden('No access to project');
      if (data.status && role !== 'owner') throw forbidden('Only owner can change status');
    }
    return updateProject(id, data);
  }

  async delete(id: string, actorId?: string) {
    if (actorId) {
      const role = await getMemberRole(id, actorId);
      if (role !== 'owner') throw forbidden('Only owner can delete project');
    }
    await softDeleteProject(id);
  }

  async addMember(projectId: string, userId: string, role: string, actorId?: string) {
    if (actorId) {
      const actorRole = await getMemberRole(projectId, actorId);
      if (actorRole !== 'owner') throw forbidden('Only owner can add members');
    }
    return addProjectMember(projectId, userId, role);
  }

  async members(projectId: string, actorId?: string) {
    if (actorId) {
      const role = await getMemberRole(projectId, actorId);
      if (!role) throw forbidden('No access to members');
    }
    return listProjectMembers(projectId);
  }

  async removeMember(projectId: string, userId: string, actorId?: string) {
    if (actorId) {
      const role = await getMemberRole(projectId, actorId);
      if (role !== 'owner') throw forbidden('Only owner can remove members');
    }
    await removeProjectMember(projectId, userId);
  }
}


