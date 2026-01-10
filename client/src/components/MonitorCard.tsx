import { useEffect, useState } from 'react'
import type { Monitor } from '../types'

interface MonitorCardProps {
  monitor: Monitor
}

export default function MonitorCard({ monitor }: MonitorCardProps) {
  const [status, setStatus] = useState<'up' | 'down' | 'unknown'>('unknown')
  const [responseTime, setResponseTime] = useState<number | null>(null)

  useEffect(() => {
    // In a real implementation, this would fetch live status
    // For now, assume operational
    setStatus('up')
    setResponseTime(Math.random() * 500 + 50) // Mock response time
  }, [monitor])

  const statusColor = {
    up: 'var(--color-success)',
    down: 'var(--color-error)',
    unknown: 'var(--color-warning)',
  }[status]

  const statusIcon = {
    up: '✓',
    down: '✗',
    unknown: '?',
  }[status]

  return (
    <div className="monitor-card">
      <div className="monitor-header">
        <div className="monitor-info">
          <h3 className="monitor-name">{monitor.name}</h3>
          <span className="monitor-type">{monitor.type.toUpperCase()}</span>
        </div>
        <div 
          className="monitor-status"
          style={{ backgroundColor: statusColor }}
          title={status.toUpperCase()}
        >
          {statusIcon}
        </div>
      </div>
      
      <div className="monitor-details">
        <div className="monitor-metric">
          <span className="metric-label">Response Time</span>
          <span className="metric-value">
            {responseTime ? `${responseTime.toFixed(0)}ms` : '-'}
          </span>
        </div>
        <div className="monitor-metric">
          <span className="metric-label">Uptime (30d)</span>
          <span className="metric-value">
            {monitor.uptime ? `${monitor.uptime.toFixed(2)}%` : '100%'}
          </span>
        </div>
      </div>
    </div>
  )
}
