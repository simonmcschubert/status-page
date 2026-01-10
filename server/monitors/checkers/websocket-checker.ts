import WebSocket from 'ws';

export interface CheckResult {
  success: boolean;
  responseTime: number;
  context: Record<string, any>;
  error?: string;
}

export class WebSocketChecker {
  static async check(url: string): Promise<CheckResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(url, {
          handshakeTimeout: 30000,
        });

        let connected = false;

        ws.on('open', () => {
          connected = true;
          const responseTime = Date.now() - startTime;
          ws.close();
          
          resolve({
            success: true,
            responseTime,
            context: {
              CONNECTED: true,
              RESPONSE_TIME: responseTime,
              TIMESTAMP: new Date().toISOString(),
            },
          });
        });

        ws.on('error', (error) => {
          if (!connected) {
            const responseTime = Date.now() - startTime;
            resolve({
              success: false,
              responseTime,
              error: error.message,
              context: {
                CONNECTED: false,
                ERROR: error.message,
                RESPONSE_TIME: responseTime,
                TIMESTAMP: new Date().toISOString(),
              },
            });
          }
        });

        ws.on('close', () => {
          if (!connected) {
            const responseTime = Date.now() - startTime;
            resolve({
              success: false,
              responseTime,
              error: 'Connection closed before opening',
              context: {
                CONNECTED: false,
                ERROR: 'Connection closed before opening',
                RESPONSE_TIME: responseTime,
                TIMESTAMP: new Date().toISOString(),
              },
            });
          }
        });

        // Timeout fallback
        setTimeout(() => {
          if (!connected) {
            ws.terminate();
            const responseTime = Date.now() - startTime;
            resolve({
              success: false,
              responseTime,
              error: 'Connection timeout',
              context: {
                CONNECTED: false,
                ERROR: 'Connection timeout',
                RESPONSE_TIME: responseTime,
                TIMESTAMP: new Date().toISOString(),
              },
            });
          }
        }, 30000);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          context: {
            CONNECTED: false,
            ERROR: error instanceof Error ? error.message : 'Unknown error',
            RESPONSE_TIME: responseTime,
            TIMESTAMP: new Date().toISOString(),
          },
        });
      }
    });
  }
}
