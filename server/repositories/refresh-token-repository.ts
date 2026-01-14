import pool from '../db/index.js';
import crypto from 'crypto';

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
}

// Refresh tokens expire in 7 days
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const RefreshTokenRepository = {
  /**
   * Create a new refresh token for a user
   */
  async create(userId: number): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    return token;
  },

  /**
   * Find refresh token and validate it's not expired
   */
  async findValid(token: string): Promise<RefreshToken | null> {
    const result = await pool.query(
      `SELECT * FROM refresh_tokens 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  },

  /**
   * Delete a specific refresh token (logout)
   */
  async delete(token: string): Promise<void> {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  },

  /**
   * Delete all refresh tokens for a user (logout everywhere)
   */
  async deleteAllForUser(userId: number): Promise<void> {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  },

  /**
   * Clean up expired tokens (can be run periodically)
   */
  async cleanupExpired(): Promise<number> {
    const result = await pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );
    return result.rowCount || 0;
  },
};
