import { AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import type { Incident } from '../types'

interface IncidentTimelineProps {
  incidents: Incident[]
}

function getSeverityVariant(severity: string): 'default' | 'warning' | 'destructive' {
  switch (severity) {
    case 'critical':
      return 'destructive'
    case 'major':
      return 'destructive'
    case 'minor':
      return 'warning'
    default:
      return 'default'
  }
}

function getStatusVariant(status: string): 'success' | 'destructive' | 'warning' {
  switch (status) {
    case 'resolved':
      return 'success'
    case 'investigating':
      return 'warning'
    case 'identified':
      return 'destructive'
    case 'monitoring':
      return 'success'
    default:
      return 'warning'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'resolved':
      return <CheckCircle className="h-4 w-4" />
    case 'investigating':
    case 'identified':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export default function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  if (incidents.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <CheckCircle className="h-5 w-5 mr-2 text-success" />
        <span>No incidents to display</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <Card 
          key={incident.id} 
          className={cn(
            "border-l-4",
            incident.status === 'resolved' && "border-l-success",
            incident.status === 'investigating' && "border-l-warning",
            incident.status === 'identified' && "border-l-destructive",
            !['resolved', 'investigating', 'identified'].includes(incident.status) && "border-l-muted"
          )}
        >
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant={getSeverityVariant(incident.severity)}>
                    {incident.severity}
                  </Badge>
                  <h3 className="font-medium text-foreground truncate">
                    {incident.title}
                  </h3>
                </div>
                
                {incident.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {incident.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Started: {new Date(incident.startedAt).toLocaleString()}
                  </span>
                  {incident.resolvedAt && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Resolved: {new Date(incident.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <Badge 
                variant={getStatusVariant(incident.status)}
                className="flex items-center gap-1 shrink-0"
              >
                {getStatusIcon(incident.status)}
                {incident.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
