import dns from 'dns/promises';

export interface CheckResult {
  success: boolean;
  responseTime: number;
  context: Record<string, any>;
  error?: string;
}

export class DnsChecker {
  static async check(url: string): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      // Parse DNS query from URL
      // Format: dns://hostname?type=A&expect=1.2.3.4
      const dnsUrl = new URL(url);
      const hostname = dnsUrl.hostname || dnsUrl.pathname.replace('//', '');
      const recordType = (dnsUrl.searchParams.get('type') || 'A').toUpperCase();
      const expectedValue = dnsUrl.searchParams.get('expect') || undefined;

      let records: any;
      
      switch (recordType) {
        case 'A':
          records = await dns.resolve4(hostname);
          break;
        case 'AAAA':
          records = await dns.resolve6(hostname);
          break;
        case 'CNAME':
          records = await dns.resolveCname(hostname);
          break;
        case 'MX':
          records = await dns.resolveMx(hostname);
          break;
        case 'TXT':
          records = await dns.resolveTxt(hostname);
          break;
        case 'NS':
          records = await dns.resolveNs(hostname);
          break;
        default:
          records = await dns.resolve4(hostname);
      }

      const responseTime = Date.now() - startTime;
      
      // Check if expected value matches (if provided)
      let success = true;
      if (expectedValue) {
        const recordsStr = JSON.stringify(records);
        success = recordsStr.includes(expectedValue);
      }

      return {
        success,
        responseTime,
        context: {
          DNS_RCODE: 'NOERROR',
          DNS_RECORDS: records,
          DNS_HOSTNAME: hostname,
          DNS_TYPE: recordType,
          RESPONSE_TIME: responseTime,
          TIMESTAMP: new Date().toISOString(),
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'DNS lookup failed',
        context: {
          DNS_RCODE: 'SERVFAIL',
          ERROR: error instanceof Error ? error.message : 'DNS lookup failed',
          RESPONSE_TIME: responseTime,
          TIMESTAMP: new Date().toISOString(),
        },
      };
    }
  }
}
