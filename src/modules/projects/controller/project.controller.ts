import { Request, Response } from 'express';
import { ProjectService } from '../service/project.service';
import { badRequest } from '../../../shared/errors/ApiError';

const service = new ProjectService();

export async function listProjectsController(req: Request, res: Response) {
  const ownerId = req.user!.id;
  const data = await service.list(ownerId);
  res.status(200).json(data);
}

export async function createProjectController(req: Request, res: Response) {
  const ownerId = req.user!.id;
  const project = await service.create(ownerId, req.body);
  res.status(201).json(project);
}

export async function getProjectController(req: Request, res: Response) {
  const id = req.params.id as string;
  const p = await service.get(id, req.user!.id);
  res.status(200).json(p);
}

export async function updateProjectController(req: Request, res: Response) {
  const id = req.params.id as string;
  const p = await service.update(id, req.body, req.user!.id);
  res.status(200).json(p);
}

export async function deleteProjectController(req: Request, res: Response) {
  const id = req.params.id as string;
  await service.delete(id, req.user!.id);
  res.status(204).send();
}

export async function addMemberController(req: Request, res: Response) {
  const id = req.params.id as string;
  const m = await service.addMember(id, req.body.userId, req.body.role ?? 'editor', req.user!.id);
  res.status(200).json(m);
}

export async function listMembersController(req: Request, res: Response) {
  const id = req.params.id as string;
  const m = await service.members(id, req.user!.id);
  res.status(200).json(m);
}

export async function removeMemberController(req: Request, res: Response) {
  const id = req.params.id as string;
  const userId = req.params.userId as string;
  await service.removeMember(id, userId, req.user!.id);
  res.status(204).send();
}


