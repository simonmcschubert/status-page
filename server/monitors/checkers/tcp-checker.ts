import net from 'net';
import type { CheckResult } from './http-checker.js';

export class TcpChecker {
  static async check(url: string, timeout: number = 10000): Promise<CheckResult> {
    const startTime = Date.now();
    
    // Parse tcp://host:port
    const match = url.match(/^tcp:\/\/([^:]+):(\d+)$/);
    if (!match) {
      return {
        success: false,
        responseTime: 0,
        context: {
          CONNECTED: false,
          ERROR: 'Invalid TCP URL format. Expected: tcp://host:port',
          TIMESTAMP: new Date().toISOString(),
        },
        error: 'Invalid URL format',
      };
    }

    const [, host, portStr] = match;
    const port = parseInt(portStr, 10);

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let connected = false;

      const cleanup = () => {
        socket.destroy();
      };

      const timer = setTimeout(() => {
        cleanup();
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          responseTime,
          context: {
            CONNECTED: false,
            ERROR: 'Connection timeout',
            TIMESTAMP: new Date().toISOString(),
          },
          error: 'Connection timeout',
        });
      }, timeout);

      socket.on('connect', () => {
        connected = true;
        clearTimeout(timer);
        const responseTime = Date.now() - startTime;
        cleanup();
        
        resolve({
          success: true,
          responseTime,
          context: {
            CONNECTED: true,
            RESPONSE_TIME: responseTime,
            STATUS: 'connected',
            TIMESTAMP: new Date().toISOString(),
          },
        });
      });

      socket.on('error', (error) => {
        if (!connected) {
          clearTimeout(timer);
          const responseTime = Date.now() - startTime;
          cleanup();
          
          resolve({
            success: false,
            responseTime,
            context: {
              CONNECTED: false,
              ERROR: error.message,
              TIMESTAMP: new Date().toISOString(),
            },
            error: error.message,
          });
        }
      });

      socket.connect(port, host);
    });
  }
}
