import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { projectRouter } from './project.routes';
import { taskRouter } from './task.routes';
import { adminRouter } from './admin.routes';

// Root API router - all feature routers are mounted here
export const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/admin', adminRouter);
// apiRouter.use('/tasks', tasksRouter);
