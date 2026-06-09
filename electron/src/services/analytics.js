import { app } from 'electron';
import { db } from '../db/index.js';
import { config as configTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import crypto from 'crypto';

/**
 * Servicio de Analíticas Anónimas (Opt-in)
 * Solo recopila métricas técnicas si el usuario lo autoriza.
 */
class AnalyticsService {
  constructor() {
    this.enabled = false;
    this.anonymousId = null;
  }

  async init() {
    try {
      const config = db.select().from(configTable).all();
      const analyticsEnabled = config.find(c => c.key === 'analytics_enabled')?.value === 'true';
      let anonymousId = config.find(c => c.key === 'anonymous_id')?.value;

      if (!anonymousId) {
        anonymousId = crypto.randomUUID();
        db.insert(configTable).values({ key: 'anonymous_id', value: anonymousId }).run();
      }

      this.enabled = analyticsEnabled;
      this.anonymousId = anonymousId;

      if (this.enabled) {
        logger.info('Analytics enabled (anonymous_id: ' + this.anonymousId + ')');
      }
    } catch (err) {
      logger.error('Failed to initialize analytics:', err);
    }
  }

  async setOptIn(enabled) {
    this.enabled = enabled;
    db.update(configTable)
      .set({ value: enabled ? 'true' : 'false' })
      .where(eq(configTable.key, 'analytics_enabled'))
      .run();
    
    if (enabled) {
      logger.info('User opted-in to anonymous analytics');
    } else {
      logger.info('User opted-out of anonymous analytics');
    }
  }

  trackEvent(event, properties = {}) {
    if (!this.enabled) return;

    const payload = {
      anonymousId: this.anonymousId,
      event,
      properties,
      context: {
        appVersion: app.getVersion(),
        platform: process.platform,
        arch: process.arch
      },
      timestamp: new Date().toISOString()
    };

    // Aquí se enviaría a un servicio como Posthog, Mixpanel o un backend propio
    // Por ahora solo lo registramos en el logger de debug
    logger.debug('Tracking Event:', payload);
  }
}

export const analytics = new AnalyticsService();
