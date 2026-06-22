import { Router } from 'express';
import { healthRouter } from './health.routes';

// Root API router - all feature routers will be mounted here as they are built
export const apiRouter = Router();

apiRouter.use('/', healthRouter);
// apiRouter.use('/auth', authRouter);
// apiRouter.use('/projects', projectsRouter);
// apiRouter.use('/tasks', tasksRouter);
