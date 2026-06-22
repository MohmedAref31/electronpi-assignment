import { Request, Response, NextFunction } from 'express';
import {
  createProject,
  listOwnProjects,
  getOwnProject,
  updateOwnProject,
  deleteOwnProject,
  serializeProject,
} from '../services/project.service';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await createProject(req.user!.id, {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
    });

    res.status(201).json({
      success: true,
      data: { project: serializeProject(project) },
    });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, total, page, limit } = await listOwnProjects(req.user!.id, {
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      data: {
        projects: items.map(serializeProject),
        total,
        page,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await getOwnProject(req.user!.id, parseInt(req.params.id, 10));
    res.status(200).json({
      success: true,
      data: { project: serializeProject(project) },
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await updateOwnProject(req.user!.id, parseInt(req.params.id, 10), {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
    });

    res.status(200).json({
      success: true,
      data: { project: serializeProject(project) },
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteOwnProject(req.user!.id, parseInt(req.params.id, 10));
    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
