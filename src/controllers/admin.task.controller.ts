import { Request, Response, NextFunction } from 'express';
import {
  listAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  serializeTask,
  parseTaskFilters,
} from '../services/task.service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = parseTaskFilters(req.query);
    const { items, total, page, limit } = await listAllTasks(
      parseInt(req.params.projectId, 10),
      filters,
      req.pagination!,
    );

    res.status(200).json({
      success: true,
      data: {
        tasks: items.map(serializeTask),
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
    const task = await getTaskById(parseInt(req.params.id, 10));
    res.status(200).json({
      success: true,
      data: { task: serializeTask(task) },
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await updateTask(parseInt(req.params.id, 10), {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    });

    res.status(200).json({
      success: true,
      data: { task: serializeTask(task) },
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteTask(parseInt(req.params.id, 10));
    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
