import pool from '../db/index.js';

export interface AppSettings {
  title?: string;
  description?: string;
  logo_url?: string;
  timezone?: string;
  noindex?: boolean;
}

export interface NotificationSettings {
  webhook_url?: string;
  cooldown?: number;
  template?: string;
}

export interface Settings {
  id: number;
  app: AppSettings;
  notifications: NotificationSettings;
  updated_at: Date;
}

export const SettingsRepository = {
  /**
   * Get all settings (single row)
   */
  async get(): Promise<Settings> {
    const result = await pool.query(
      'SELECT * FROM settings WHERE id = 1'
    );
    
    if (result.rows.length === 0) {
      // Insert default settings if not exists
      await pool.query(
        `INSERT INTO settings (id, app, notifications) 
         VALUES (1, '{}', '{}')
         ON CONFLICT (id) DO NOTHING`
      );
      return {
        id: 1,
        app: {},
        notifications: {},
        updated_at: new Date(),
      };
    }
    
    return result.rows[0];
  },

  /**
   * Update app settings (title, description, logo, etc.)
   */
  async updateApp(settings: AppSettings): Promise<Settings> {
    const result = await pool.query(
      `UPDATE settings 
       SET app = $1, updated_at = NOW() 
       WHERE id = 1
       RETURNING *`,
      [JSON.stringify(settings)]
    );
    return result.rows[0];
  },

  /**
   * Update notification settings
   */
  async updateNotifications(settings: NotificationSettings): Promise<Settings> {
    const result = await pool.query(
      `UPDATE settings 
       SET notifications = $1, updated_at = NOW() 
       WHERE id = 1
       RETURNING *`,
      [JSON.stringify(settings)]
    );
    return result.rows[0];
  },

  /**
   * Update all settings at once
   */
  async updateAll(app: AppSettings, notifications: NotificationSettings): Promise<Settings> {
    const result = await pool.query(
      `UPDATE settings 
       SET app = $1, notifications = $2, updated_at = NOW() 
       WHERE id = 1
       RETURNING *`,
      [JSON.stringify(app), JSON.stringify(notifications)]
    );
    return result.rows[0];
  },
};
