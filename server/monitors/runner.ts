import type { Monitor } from '../config/schemas/monitors.schema.js';
import { HttpChecker } from './checkers/http-checker.js';
import { TcpChecker } from './checkers/tcp-checker.js';
import { ConditionEvaluator } from './condition-evaluator.js';
import type { CheckResult } from './checkers/http-checker.js';

export interface MonitorCheckResult {
  monitorId?: number;
  monitorName: string;
  success: boolean;
  responseTime: number;
  timestamp: Date;
  error?: string;
  conditionResults: { condition: string; success: boolean }[];
}

export class MonitorRunner {
  static async runCheck(monitor: Monitor, monitorId?: number): Promise<MonitorCheckResult> {
    let checkResult: CheckResult;

    // Run the appropriate checker based on monitor type
    switch (monitor.type) {
      case 'http':
        checkResult = await HttpChecker.check(monitor.url);
        break;
      
      case 'tcp':
        checkResult = await TcpChecker.check(monitor.url);
        break;
      
      case 'websocket':
        // TODO: Implement WebSocket checker
        checkResult = {
          success: false,
          responseTime: 0,
          context: { ERROR: 'WebSocket checker not implemented yet', TIMESTAMP: new Date().toISOString() },
          error: 'Not implemented',
        };
        break;
      
      case 'dns':
        // TODO: Implement DNS checker
        checkResult = {
          success: false,
          responseTime: 0,
          context: { ERROR: 'DNS checker not implemented yet', TIMESTAMP: new Date().toISOString() },
          error: 'Not implemented',
        };
        break;
      
      case 'ping':
        // TODO: Implement ICMP ping checker
        checkResult = {
          success: false,
          responseTime: 0,
          context: { ERROR: 'Ping checker not implemented yet', TIMESTAMP: new Date().toISOString() },
          error: 'Not implemented',
        };
        break;
      
      default:
        checkResult = {
          success: false,
          responseTime: 0,
          context: { ERROR: `Unknown monitor type: ${monitor.type}`, TIMESTAMP: new Date().toISOString() },
          error: 'Unknown monitor type',
        };
    }

    // Evaluate conditions
    const conditionResults = ConditionEvaluator.evaluateAll(
      monitor.conditions,
      checkResult.context
    );

    // Check passes only if all conditions pass
    const allConditionsPass = conditionResults.every(r => r.success);

    return {
      monitorId,
      monitorName: monitor.name,
      success: checkResult.success && allConditionsPass,
      responseTime: checkResult.responseTime,
      timestamp: new Date(),
      error: checkResult.error,
      conditionResults,
    };
  }

  static async runChecks(monitors: Monitor[]): Promise<MonitorCheckResult[]> {
    const results = await Promise.all(
      monitors.map(monitor => this.runCheck(monitor))
    );
    return results;
  }
}
