import { CheckRepository } from '../repositories/check-repository.js';
import { IncidentRepository } from '../repositories/incident-repository.js';
import type { AppConfig } from '../config/schemas/app.schema.js';

// Default retention periods (in days)
const DEFAULT_CHECKS_RETENTION = 90;
const DEFAULT_INCIDENTS_RETENTION = 365;

/**
 * Schedule daily data retention cleanup
 * Runs at 00:30 every day to clean up old checks and resolved incidents
 */
export function scheduleDataRetention(config: AppConfig): void {
  const checksRetention = config.data?.retention_days ?? DEFAULT_CHECKS_RETENTION;
  const incidentsRetention = config.data?.incidents_retention_days ?? DEFAULT_INCIDENTS_RETENTION;
  
  // Calculate time until 00:30
  const now = new Date();
  const targetTime = new Date(now);
  targetTime.setDate(targetTime.getDate() + (now.getHours() >= 1 ? 1 : 0));
  targetTime.setHours(0, 30, 0, 0);
  
  const msUntilRun = targetTime.getTime() - now.getTime();
  
  console.log('🗑️  Data retention scheduled in ' + Math.round(msUntilRun / 1000 / 60) + ' minutes');
  console.log('   Checks: ' + checksRetention + ' days, Incidents: ' + incidentsRetention + ' days');
  
  // Schedule first run
  setTimeout(async () => {
    await runDataRetention(checksRetention, incidentsRetention);
    
    // Then run every 24 hours
    setInterval(() => runDataRetention(checksRetention, incidentsRetention), 24 * 60 * 60 * 1000);
  }, msUntilRun);
}

/**
 * Run the data retention cleanup job
 */
export async function runDataRetention(
  checksRetentionDays: number = DEFAULT_CHECKS_RETENTION,
  incidentsRetentionDays: number = DEFAULT_INCIDENTS_RETENTION
): Promise<{ deletedChecks: number; deletedIncidents: number }> {
  console.log('🗑️  Running data retention cleanup...');
  
  let deletedChecks = 0;
  let deletedIncidents = 0;
  
  try {
    // Delete old checks
    deletedChecks = await CheckRepository.deleteOldChecks(checksRetentionDays);
    console.log('   Deleted ' + deletedChecks + ' checks older than ' + checksRetentionDays + ' days');
    
    // Delete old resolved incidents
    deletedIncidents = await IncidentRepository.deleteOldResolvedIncidents(incidentsRetentionDays);
    console.log('   Deleted ' + deletedIncidents + ' resolved incidents older than ' + incidentsRetentionDays + ' days');
    
    console.log('✅ Data retention cleanup complete');
  } catch (error) {
    console.error('❌ Data retention cleanup failed:', error);
  }
  
  return { deletedChecks, deletedIncidents };
}
