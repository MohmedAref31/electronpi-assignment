import { Router } from 'express';
import { adminProjectRouter } from './admin.project.routes';

// Parent admin router - admin-scoped sub-routers are mounted here
export const adminRouter = Router();

adminRouter.use('/projects', adminProjectRouter);
// adminRouter.use('/tasks', adminTaskRouter); // added in a future step
