import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';

export const healthRouter = Router();

/**
 * GET /api/v1/health
 * Returns service + database connectivity status.
 */
healthRouter.get('/health', async (req: Request, res: Response) => {
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';

  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.query('SELECT 1');
      dbStatus = 'connected';
    }
  } catch {
    dbStatus = 'disconnected';
  }

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    success: true,
    data: {
      service: req.t('health.service'),
      status: req.t('health.statusOk'),
      database: req.t(dbStatus === 'connected' ? 'health.dbConnected' : 'health.dbDisconnected'),
      language: req.language,
      timestamp: new Date().toISOString(),
    },
  });
});
