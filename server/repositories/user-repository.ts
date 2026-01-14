import pool from '../db/index.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword {
  id: number;
  email: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export const UserRepository = {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<UserWithoutPassword | null> {
    const result = await pool.query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Create a new user with hashed password
   */
  async create(email: string, password: string, name?: string): Promise<UserWithoutPassword> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at, updated_at`,
      [email.toLowerCase(), passwordHash, name || null]
    );
    return result.rows[0];
  },

  /**
   * Verify password against stored hash
   */
  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  },

  /**
   * Update user's password
   */
  async updatePassword(userId: number, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );
  },

  /**
   * Check if any users exist (for auto-setup)
   */
  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Update user's email by ID
   */
  async updateEmail(userId: number, email: string): Promise<void> {
    await pool.query(
      `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
      [email.toLowerCase(), userId]
    );
  },
};
