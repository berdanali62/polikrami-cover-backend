import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { badRequest, notFound, forbidden } from '../../../shared/errors/ApiError';
import { createOrganizationSchema, updateOrganizationSchema, addMemberSchema, updateMemberRoleSchema } from '../dto/organization.dto';

export async function listMyOrganizationsController(req: Request, res: Response) {
  const userId = req.user!.id;
  const orgs = await prisma.organization.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    include: { _count: { select: { members: true, projects: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json(orgs);
}

export async function getOrganizationController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const org = await prisma.organization.findUnique({
    where: { id },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } }
  });
  if (!org) throw notFound('Organization not found');
  res.status(200).json(org);
}

export async function createOrganizationController(req: Request, res: Response) {
  const { name, slug } = createOrganizationSchema.parse(req.body);
  const ownerId = req.user!.id;
  const exists = await prisma.organization.findUnique({ where: { slug } });
  if (exists) throw badRequest('Slug already exists');
  const org = await prisma.organization.create({ data: { name, slug, ownerId } });
  res.status(201).json(org);
}

export async function updateOrganizationController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const data = updateOrganizationSchema.parse(req.body);
  const userId = req.user!.id;
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw notFound('Organization not found');
  if (org.ownerId !== userId) throw forbidden('Only owner can update organization');
  if (data.slug && data.slug !== org.slug) {
    const exists = await prisma.organization.findUnique({ where: { slug: data.slug } });
    if (exists) throw badRequest('Slug already exists');
  }
  const updated = await prisma.organization.update({ where: { id }, data });
  res.status(200).json(updated);
}

export async function deleteOrganizationController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.user!.id;
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw notFound('Organization not found');
  if (org.ownerId !== userId) throw forbidden('Only owner can delete organization');
  await prisma.organization.delete({ where: { id } });
  res.status(204).send();
}

export async function addMemberController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const { userId, role } = addMemberSchema.parse(req.body);
  const me = req.user!.id;
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw notFound('Organization not found');
  if (org.ownerId !== me) throw forbidden('Only owner can add member');
  await prisma.organizationMember.create({ data: { organizationId: id, userId, role } });
  res.status(201).json({ ok: true });
}

export async function updateMemberRoleController(req: Request, res: Response) {
  const { id, userId } = req.params as { id: string; userId: string };
  const { role } = updateMemberRoleSchema.parse(req.body);
  const me = req.user!.id;
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw notFound('Organization not found');
  if (org.ownerId !== me) throw forbidden('Only owner can update member roles');
  await prisma.organizationMember.update({ where: { organizationId_userId: { organizationId: id, userId } }, data: { role } });
  res.status(200).json({ ok: true });
}

export async function removeMemberController(req: Request, res: Response) {
  const { id, userId } = req.params as { id: string; userId: string };
  const me = req.user!.id;
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw notFound('Organization not found');
  if (org.ownerId !== me) throw forbidden('Only owner can remove member');
  await prisma.organizationMember.delete({ where: { organizationId_userId: { organizationId: id, userId } } });
  res.status(204).send();
}


