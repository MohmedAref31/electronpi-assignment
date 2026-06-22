import { Request, Response, NextFunction } from 'express';
import acceptLanguageParser from 'accept-language-parser';
import i18next from 'i18next';
import { envVars } from '../config/env';

declare module 'express-serve-static-core' {
  interface Request {
    /** Resolved language for this request (e.g. "en" or "ar") */
    language: string;
    /** Translate a key for the request's language */
    t: (key: string, options?: Record<string, unknown>) => string;
  }
}

/**
 * Detects the request language from, in priority order:
 *   1. ?lang= query parameter
 *   2. Accept-Language header
 *   3. DEFAULT_LANGUAGE env var
 * Attaches `language` and `t` to req for downstream handlers.
 */
export function i18nMiddleware(req: Request, _res: Response, next: NextFunction): void {
  let lang: string | null = null;

  // 1. Explicit query param wins
  if (typeof req.query.lang === 'string' && req.query.lang) {
    lang = req.query.lang;
  }

  // 2. Fall back to Accept-Language header
  if (!lang && req.headers['accept-language']) {
    const parsed = acceptLanguageParser.pick(
      envVars.i18n.supportedLanguages,
      req.headers['accept-language'],
      { loose: true },
    );
    lang = parsed ?? null;
  }

  // 3. Final fallback to default
  const resolved =
    lang && envVars.i18n.supportedLanguages.includes(lang)
      ? lang
      : envVars.i18n.defaultLanguage;

  req.language = resolved;
  req.t = (key: string, options?: Record<string, unknown>) =>
    i18next.t(key, { lng: resolved, ...options });

  next();
}
