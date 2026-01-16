import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Activity, Server, AlertCircle } from 'lucide-react'
import { MonitorRow } from '../components/MonitorRow'
import IncidentTimeline from '../components/IncidentTimeline'
import AnnouncementBanner from '../components/AnnouncementBanner'
import type { Announcement } from '../components/AnnouncementBanner'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { fetchMonitors, fetchIncidents, fetchAnnouncements } from '../services/api'
import { useSmartPolling } from '../hooks/useSmartPolling'
import { cn } from '../lib/utils'
import type { Monitor, Incident } from '../types'

export default function StatusPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [monitorsData, incidentsData, announcementsData] = await Promise.all([
        fetchMonitors(),
        fetchIncidents(),
        fetchAnnouncements(),
      ])
      
      setMonitors(monitorsData)
      setIncidents(incidentsData)
      setAnnouncements(announcementsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Smart polling: 10s when active, 60s when tab hidden
  useSmartPolling({
    onPoll: loadData,
    activeInterval: 10000,
    inactiveInterval: 60000,
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span>Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const activeIncidents = incidents.filter(i => !i.resolvedAt)
  const hasIssues = activeIncidents.length > 0 || monitors.some(m => m.currentStatus !== 'up')
  const allDown = monitors.length > 0 && monitors.every(m => m.currentStatus === 'down')

  // Calculate overall uptime
  const overallUptime = monitors.length > 0
    ? monitors.reduce((sum, m) => sum + (m.uptime ?? 100), 0) / monitors.length
    : 100

  const getStatusIcon = () => {
    if (allDown) return <XCircle className="h-8 w-8" />
    if (hasIssues) return <AlertTriangle className="h-8 w-8" />
    return <CheckCircle className="h-8 w-8" />
  }

  const getStatusText = () => {
    if (allDown) return 'All Systems Down'
    if (hasIssues) return 'Some Systems Experiencing Issues'
    return 'All Systems Operational'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <AnnouncementBanner announcements={announcements} />
        </div>
      )}

      {/* Status Banner */}
      <div className={cn(
        "py-8 px-6",
        allDown && "bg-destructive/10",
        hasIssues && !allDown && "bg-warning/10",
        !hasIssues && "bg-success/10"
      )}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-full",
            allDown && "bg-destructive/20 text-destructive",
            hasIssues && !allDown && "bg-warning/20 text-warning",
            !hasIssues && "bg-success/20 text-success"
          )}>
            {getStatusIcon()}
          </div>
          <div>
            <h1 className={cn(
              "text-2xl font-bold",
              allDown && "text-destructive",
              hasIssues && !allDown && "text-warning",
              !hasIssues && "text-success"
            )}>
              {getStatusText()}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold text-foreground">Active Incidents</h2>
            </div>
            <IncidentTimeline incidents={activeIncidents} />
          </section>
        )}

        {/* Services List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Uptime
              </h2>
              <span className="text-sm text-muted-foreground">Last 90 days</span>
            </div>
          </div>

          <div className="space-y-3">
            {monitors.map((monitor) => (
              <MonitorRow key={monitor.id} monitor={monitor} />
            ))}
          </div>
        </section>

        {/* Overall Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  overallUptime >= 99.9 ? "text-success" :
                  overallUptime >= 99 ? "text-warning" : "text-destructive"
                )}>
                  {overallUptime.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">Overall Uptime</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  {monitors.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Services Monitored</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-success flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {monitors.filter(m => m.currentStatus === 'up').length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Operational</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={cn(
                  "text-2xl font-bold flex items-center justify-center gap-2",
                  activeIncidents.length > 0 ? "text-warning" : "text-success"
                )}>
                  <AlertCircle className="h-5 w-5" />
                  {activeIncidents.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Active Incidents</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Status Updates / Incident History */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Status Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length > 0 ? (
                <IncidentTimeline incidents={incidents.slice(0, 5)} />
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 mr-2 text-success" />
                  <span>No incidents reported. All systems operating normally.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
