import { StatusHistoryRepository } from '../repositories/status-history-repository.js';

/**
 * Schedule daily aggregation of status history
 * Runs at midnight every day
 */
export function scheduleDailyAggregation(): void {
  // Calculate time until next midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 5, 0, 0); // Run at 00:05 to ensure all data is in
  
  const msUntilMidnight = midnight.getTime() - now.getTime();
  
  console.log(`📅 Daily aggregation scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  
  // Schedule first run
  setTimeout(async () => {
    await runDailyAggregation();
    
    // Then run every 24 hours
    setInterval(runDailyAggregation, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}

/**
 * Run the daily aggregation job
 */
async function runDailyAggregation(): Promise<void> {
  console.log('📊 Running daily status history aggregation...');
  
  try {
    await StatusHistoryRepository.aggregateAllYesterday();
    console.log('✅ Daily aggregation complete');
  } catch (error) {
    console.error('❌ Daily aggregation failed:', error);
  }
}

/**
 * Backfill historical data on startup
 */
export async function backfillHistoryOnStartup(): Promise<void> {
  console.log('📊 Checking for missing historical data...');
  
  try {
    const count = await StatusHistoryRepository.backfillHistory(90);
    if (count > 0) {
      console.log(`✅ Backfilled ${count} days of historical data`);
    } else {
      console.log('✅ Historical data is up to date');
    }
  } catch (error) {
    console.error('❌ Backfill failed:', error);
  }
}

/**
 * Run periodic aggregation for today (every hour)
 * This keeps today's stats up to date in real-time
 */
export function scheduleHourlyAggregation(): void {
  // Run immediately on startup
  setTimeout(async () => {
    await aggregateToday();
  }, 5000); // Wait 5 seconds for DB connection
  
  // Then run every hour
  setInterval(aggregateToday, 60 * 60 * 1000);
  
  console.log('📅 Hourly aggregation scheduled');
}

async function aggregateToday(): Promise<void> {
  try {
    await StatusHistoryRepository.aggregateToday();
  } catch (error) {
    console.error('❌ Hourly aggregation failed:', error);
  }
}
