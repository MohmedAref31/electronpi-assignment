import { Router } from 'express';
import { adminProjectRouter } from './admin.project.routes';
import { adminTaskRouter } from './admin.task.routes';

// Parent admin router - admin-scoped sub-routers are mounted here
export const adminRouter = Router();

adminRouter.use('/projects', adminProjectRouter);
adminRouter.use('/tasks', adminTaskRouter);
