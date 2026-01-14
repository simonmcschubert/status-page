import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createAdminApi, type Monitor } from '../../services/admin-api';

export function MonitorsPage() {
  const { accessToken } = useAuth();
  
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadMonitors = async () => {
    if (!accessToken) return;
    
    const api = createAdminApi(() => accessToken);
    
    try {
      const data = await api.getMonitors();
      setMonitors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMonitors();
  }, [accessToken]);

  const handleDelete = async (id: number) => {
    if (!accessToken) return;
    
    const api = createAdminApi(() => accessToken);
    
    try {
      await api.deleteMonitor(id);
      setMonitors(monitors.filter(m => m.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete monitor');
    }
  };

  if (isLoading) {
    return (
      <div className="text-gray-400 text-center py-8">Loading monitors...</div>
    );
  }

  // Group monitors by group
  const groups = monitors.reduce((acc, monitor) => {
    const group = monitor.group || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(monitor);
    return acc;
  }, {} as Record<string, Monitor[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitors</h1>
          <p className="text-gray-400 mt-1">Manage your status page monitors</p>
        </div>
        <Link
          to="/admin/monitors/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Add Monitor
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {monitors.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <div className="text-gray-400 mb-4">No monitors configured yet.</div>
          <Link
            to="/admin/monitors/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add your first monitor
          </Link>
        </div>
      ) : (
        Object.entries(groups).map(([groupName, groupMonitors]) => (
          <div key={groupName} className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="px-6 py-3 border-b border-gray-700">
              <h2 className="text-sm font-medium text-gray-300">{groupName}</h2>
            </div>
            <div className="divide-y divide-gray-700">
              {groupMonitors.map((monitor) => (
                <div
                  key={monitor.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{monitor.name}</span>
                      <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs uppercase">
                        {monitor.type}
                      </span>
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
                    <div className="text-gray-400 text-sm mt-1 truncate">{monitor.url}</div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/admin/monitors/${monitor.id}`}
                      className="px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    {deleteConfirm === monitor.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(monitor.id)}
                          className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 border border-red-500 hover:border-red-400 rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(monitor.id)}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 border border-gray-600 hover:border-red-500 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
