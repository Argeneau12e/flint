/**
 * Cron Jobs Index
 * 
 * Central registry for all scheduled tasks.
 * Use this to run all cron jobs or schedule them via OpenClaw gateway.
 */

import { enforceDeadlines } from './deadlines';

export interface CronJobResult {
  name: string;
  success: boolean;
  duration: number;
  result?: any;
  error?: string;
}

/**
 * Run all cron jobs
 */
export async function runAllCronJobs(): Promise<CronJobResult[]> {
  const jobs: CronJobResult[] = [];
  const startTime = Date.now();

  console.log('🕐 Starting all cron jobs...', new Date().toISOString());

  // Job 1: Deadline Enforcement
  try {
    const jobStart = Date.now();
    const result = await enforceDeadlines();
    jobs.push({
      name: 'deadline_enforcement',
      success: result.errors.length === 0,
      duration: Date.now() - jobStart,
      result,
    });
  } catch (error: any) {
    jobs.push({
      name: 'deadline_enforcement',
      success: false,
      duration: 0,
      error: error.message,
    });
  }

  // TODO: Add more cron jobs here
  // - Usage stats aggregation
  // - Credit expiration checks
  // - Email digest sending
  // - Reputation point calculations

  const totalTime = Date.now() - startTime;
  console.log(`🏁 All cron jobs completed in ${totalTime}ms`);

  return jobs;
}

/**
 * Run as standalone script
 */
if (require.main === module) {
  runAllCronJobs()
    .then(results => {
      console.log('Cron Job Results:');
      results.forEach(job => {
        const status = job.success ? '✅' : '❌';
        console.log(`${status} ${job.name} (${job.duration}ms)`);
        if (job.error) {
          console.log(`   Error: ${job.error}`);
        }
      });
      process.exit(results.every(j => j.success) ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
