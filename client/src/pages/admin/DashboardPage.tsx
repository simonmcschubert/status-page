import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createAdminApi, type Monitor } from '../../services/admin-api';

export function DashboardPage() {
  const { accessToken } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;
      
      const api = createAdminApi(() => accessToken);
      
      try {
        const monitorsData = await api.getMonitors();
        setMonitors(monitorsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [accessToken]);

  if (isLoading) {
    return (
      <div className="text-gray-400 text-center py-8">Loading dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const publicMonitors = monitors.filter(m => m.public);
  const privateMonitors = monitors.filter(m => !m.public);
  const groups = [...new Set(monitors.map(m => m.group).filter(Boolean))];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your status page</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-white">{monitors.length}</div>
          <div className="text-gray-400 text-sm mt-1">Total Monitors</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-green-400">{publicMonitors.length}</div>
          <div className="text-gray-400 text-sm mt-1">Public Monitors</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-gray-400">{privateMonitors.length}</div>
          <div className="text-gray-400 text-sm mt-1">Private Monitors</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-blue-400">{groups.length}</div>
          <div className="text-gray-400 text-sm mt-1">Groups</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/monitors/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add Monitor
          </Link>
          <Link
            to="/admin/settings"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Edit Settings
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            View Status Page
          </a>
        </div>
      </div>

      {/* Recent monitors */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Monitors</h2>
          <Link
            to="/admin/monitors"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-700">
          {monitors.slice(0, 5).map((monitor) => (
            <Link
              key={monitor.id}
              to={`/admin/monitors/${monitor.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-700/50 transition-colors"
            >
              <div>
                <div className="text-white font-medium">{monitor.name}</div>
                <div className="text-gray-400 text-sm">{monitor.url}</div>
              </div>
              <div className="flex items-center gap-3">
                {monitor.group && (
                  <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                    {monitor.group}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    monitor.public
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {monitor.public ? 'Public' : 'Private'}
                </span>
              </div>
            </Link>
          ))}
          {monitors.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">
              No monitors configured yet.{' '}
              <Link to="/admin/monitors/new" className="text-blue-400 hover:underline">
                Add your first monitor
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
