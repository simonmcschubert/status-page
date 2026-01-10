import type { Incident } from '../types'

interface IncidentTimelineProps {
  incidents: Incident[]
}

export default function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  if (incidents.length === 0) {
    return <p className="empty-state">No incidents to display</p>
  }

  return (
    <div className="incident-timeline">
      {incidents.map((incident) => (
        <div key={incident.id} className={`incident-item ${incident.status}`}>
          <div className="incident-header">
            <div className="incident-title-row">
              <span className={`severity-badge ${incident.severity}`}>
                {incident.severity}
              </span>
              <h3 className="incident-title">{incident.title}</h3>
            </div>
            <span className={`status-badge ${incident.status}`}>
              {incident.status}
            </span>
          </div>
          
          {incident.description && (
            <p className="incident-description">{incident.description}</p>
          )}
          
          <div className="incident-timeline-info">
            <span className="incident-time">
              Started: {new Date(incident.startedAt).toLocaleString()}
            </span>
            {incident.resolvedAt && (
              <span className="incident-time">
                Resolved: {new Date(incident.resolvedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
