import { useEffect, useState } from 'react'
import MonitorCard from '../components/MonitorCard'
import IncidentTimeline from '../components/IncidentTimeline'
import { fetchMonitors, fetchIncidents } from '../services/api'
import type { Monitor, Incident } from '../types'

export default function StatusPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [monitorsData, incidentsData] = await Promise.all([
        fetchMonitors(),
        fetchIncidents(),
      ])
      
      setMonitors(monitorsData)
      setIncidents(incidentsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading status...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  const activeIncidents = incidents.filter(i => !i.resolvedAt)
  const hasIssues = activeIncidents.length > 0

  return (
    <div className="container status-page">
      <div className="status-summary">
        <div className={`status-badge ${hasIssues ? 'degraded' : 'operational'}`}>
          {hasIssues ? '⚠️ Partial Outage' : '✓ All Systems Operational'}
        </div>
        <p className="status-description">
          {hasIssues 
            ? `${activeIncidents.length} active incident${activeIncidents.length > 1 ? 's' : ''}`
            : 'All monitored services are running normally'}
        </p>
      </div>

      {activeIncidents.length > 0 && (
        <section className="section">
          <h2>Active Incidents</h2>
          <IncidentTimeline incidents={activeIncidents} />
        </section>
      )}

      <section className="section">
        <h2>Services</h2>
        <div className="monitors-grid">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      </section>

      {incidents.length > 0 && (
        <section className="section">
          <h2>Incident History</h2>
          <IncidentTimeline incidents={incidents.slice(0, 10)} />
        </section>
      )}
    </div>
  )
}
