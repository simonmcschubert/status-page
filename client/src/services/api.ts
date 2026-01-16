import type { Monitor, Incident } from '../types'
import type { Announcement } from '../components/AnnouncementBanner'

const API_BASE = '/api'

export async function fetchMonitors(): Promise<Monitor[]> {
  const response = await fetch(`${API_BASE}/monitors`)
  if (!response.ok) {
    throw new Error('Failed to fetch monitors')
  }
  const data = await response.json()
  return data.monitors || []
}

export async function fetchIncidents(): Promise<Incident[]> {
  const response = await fetch(`${API_BASE}/incidents`)
  if (!response.ok) {
    throw new Error('Failed to fetch incidents')
  }
  const data = await response.json()
  return data.incidents || []
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const response = await fetch(`${API_BASE}/announcements`)
  if (!response.ok) {
    throw new Error('Failed to fetch announcements')
  }
  const data = await response.json()
  return data.announcements || []
}

export async function fetchMonitorStats(
  monitorId: number,
  days: number = 30
): Promise<any> {
  const response = await fetch(`${API_BASE}/monitors/${monitorId}/stats?days=${days}`)
  if (!response.ok) {
    throw new Error('Failed to fetch monitor stats')
  }
  return response.json()
}
