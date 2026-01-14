import { UserRepository } from './repositories/user-repository.js';

/**
 * Auto-setup: Create admin user from environment variables on first boot
 * 
 * This runs once on application startup. It checks:
 * 1. If ADMIN_PASSWORD_RESET=true, reset existing admin password
 * 2. If no users exist and ADMIN_EMAIL + ADMIN_PASSWORD are set, create admin
 */
export async function bootstrapAdmin(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const passwordReset = process.env.ADMIN_PASSWORD_RESET === 'true';

  // Handle password reset mode
  if (passwordReset && adminEmail && adminPassword) {
    const existingUser = await UserRepository.findByEmail(adminEmail);
    if (existingUser) {
      await UserRepository.updatePassword(existingUser.id, adminPassword);
      console.log(`[Bootstrap] Password reset for admin: ${adminEmail}`);
      console.log('[Bootstrap] Remember to remove ADMIN_PASSWORD_RESET from environment');
      return;
    }
  }

  // Check if any users exist
  const userCount = await UserRepository.count();
  
  if (userCount > 0) {
    console.log('[Bootstrap] Admin user already exists, skipping auto-setup');
    return;
  }

  // No users exist - try to create from env vars
  if (!adminEmail || !adminPassword) {
    console.log('[Bootstrap] No admin user exists.');
    console.log('[Bootstrap] Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables to create one.');
    console.log('[Bootstrap] Or visit /setup to create an admin user.');
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    console.error('[Bootstrap] Invalid ADMIN_EMAIL format');
    return;
  }

  // Validate password length
  if (adminPassword.length < 8) {
    console.error('[Bootstrap] ADMIN_PASSWORD must be at least 8 characters');
    return;
  }

  // Create admin user
  try {
    await UserRepository.create(adminEmail, adminPassword, 'Admin');
    console.log(`[Bootstrap] Created admin user: ${adminEmail}`);
  } catch (error) {
    console.error('[Bootstrap] Failed to create admin user:', error);
  }
}
