import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';

// Root API router - all feature routers are mounted here
export const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
// apiRouter.use('/projects', projectsRouter);
// apiRouter.use('/tasks', tasksRouter);
