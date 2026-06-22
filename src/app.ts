import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { envVars } from './config/env';
import { apiRouter } from './routes';
import { i18nMiddleware } from './middlewares/i18n';
import { notFoundHandler } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

export function createApp(): express.Application {
  const app = express();

  // ----- Security & utility middleware -----
  app.use(helmet());
  app.use(
    cors({
      origin: envVars.corsOrigin === '*' ? true : envVars.corsOrigin.split(','),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!envVars.isProduction) {
    app.use(morgan('dev'));
  }

  // ----- i18n (language detection + req.t) -----
  app.use(i18nMiddleware);

  // ----- Routes -----
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        name: 'Project & Task Management API',
        version: '1.0.0',
        docs: `/api/v1/health`,
      },
    });
  });

  app.use('/api/v1', apiRouter);

  // ----- 404 & Error handling (must be last) -----
  app.use(notFoundHandler);
  app.use(errorHandler as (err: unknown, req: Request, res: Response, next: NextFunction) => void);

  logger.info('Express application configured');
  return app;
}
