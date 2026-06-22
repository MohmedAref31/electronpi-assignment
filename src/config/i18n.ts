import path from 'path';
import i18next from 'i18next';
import FsBackend, { FsBackendOptions } from 'i18next-fs-backend';
import { envVars } from './env';
import { logger } from '../utils/logger';

let initialized = false;

/**
 * Initialize i18next once. Loads translation JSON from src/locales/<lang>/translation.json.
 * Safe to call multiple times - subsequent calls are no-ops.
 */
export async function initI18n(): Promise<typeof i18next> {
  if (initialized) return i18next;

  const localesPath = path.join(__dirname, '../locales');

  await i18next.use(FsBackend).init<FsBackendOptions>({
    lng: envVars.i18n.defaultLanguage,
    fallbackLng: envVars.i18n.defaultLanguage,
    supportedLngs: envVars.i18n.supportedLanguages,
    preload: envVars.i18n.supportedLanguages,
    backend: {
      loadPath: path.join(localesPath, '{{lng}}/translation.json'),
    },
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
  });

  initialized = true;
  logger.info('i18n initialized', {
    default: envVars.i18n.defaultLanguage,
    supported: envVars.i18n.supportedLanguages,
  });

  return i18next;
}

export default i18next;
