import { Request, Response, NextFunction } from 'express';
import {
  listAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  serializeProject,
} from '../services/project.service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, total, page, limit } = await listAllProjects(req.pagination!);

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
    const project = await getProjectById(parseInt(req.params.id, 10));
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
    const project = await updateProject(parseInt(req.params.id, 10), {
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
    await deleteProject(parseInt(req.params.id, 10));
    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
