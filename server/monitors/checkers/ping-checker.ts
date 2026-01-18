import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CheckResult {
  success: boolean;
  responseTime: number;
  context: Record<string, any>;
  error?: string;
}

export class PingChecker {
  static async check(url: string): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      // Parse hostname from URL
      // Format: ping://hostname or ping://1.2.3.4
      const pingUrl = new URL(url);
      const hostname = pingUrl.hostname || pingUrl.pathname.replace('//', '');

      // Use platform-specific ping command
      // macOS/Linux: ping -c 1 -W 5 (1 packet, 5 second timeout)
      const command = process.platform === 'win32'
        ? `ping -n 1 -w 5000 ${hostname}`
        : `ping -c 1 -W 5 ${hostname}`;

      const { stdout } = await execAsync(command, {
        timeout: 10000, // 10 second overall timeout
      });

      const responseTime = Date.now() - startTime;

      // Parse ping time from output
      // macOS/Linux: time=X.XXX ms
      // Windows: time=XXms or time<1ms
      const timeMatch = stdout.match(/time[=<](\d+\.?\d*)/i);
      // Round to integer - database column is INTEGER, sub-ms precision not needed
      const pingTime = timeMatch ? Math.round(parseFloat(timeMatch[1])) : responseTime;

      // Check if ping was successful (0% packet loss)
      const success = stdout.includes('1 received') || 
                     stdout.includes('Reply from') ||
                     !stdout.includes('100% packet loss');

      return {
        success,
        responseTime: pingTime,
        context: {
          PING_HOST: hostname,
          PING_TIME: pingTime,
          PACKET_LOSS: success ? 0 : 100,
          RESPONSE_TIME: pingTime,
          TIMESTAMP: new Date().toISOString(),
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Ping failed',
        context: {
          ERROR: error instanceof Error ? error.message : 'Ping failed',
          PACKET_LOSS: 100,
          RESPONSE_TIME: responseTime,
          TIMESTAMP: new Date().toISOString(),
        },
      };
    }
  }
}
