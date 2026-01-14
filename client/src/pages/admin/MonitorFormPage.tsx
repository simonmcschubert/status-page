import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createAdminApi } from '../../services/admin-api';

const MONITOR_TYPES = [
  { value: 'http', label: 'HTTP/HTTPS' },
  { value: 'tcp', label: 'TCP Port' },
  { value: 'ping', label: 'Ping (ICMP)' },
];

interface FormData {
  name: string;
  type: string;
  url: string;
  group: string;
  public: boolean;
}

export function MonitorFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';
  const monitorId = isEdit ? parseInt(id) : null;

  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'http',
    url: '',
    group: '',
    public: true,
  });

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    responseTime: number | null;
    error: string | null;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMonitor = async () => {
      if (!isEdit || !accessToken || !monitorId) return;

      const api = createAdminApi(() => accessToken);

      try {
        const monitor = await api.getMonitor(monitorId);
        setFormData({
          name: monitor.name,
          type: monitor.type,
          url: monitor.url,
          group: monitor.group || '',
          public: monitor.public,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load monitor');
      } finally {
        setIsLoading(false);
      }
    };

    loadMonitor();
  }, [isEdit, monitorId, accessToken]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!accessToken) return;

    setIsTesting(true);
    setTestResult(null);
    setError('');

    const api = createAdminApi(() => accessToken);

    try {
      const result = await api.testMonitor(formData.type, formData.url);
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsSaving(true);
    setError('');

    const api = createAdminApi(() => accessToken);

    try {
      if (isEdit && monitorId) {
        await api.updateMonitor(monitorId, formData);
      } else {
        await api.createMonitor(formData);
      }
      navigate('/admin/monitors');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save monitor');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-gray-400 text-center py-8">Loading monitor...</div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {isEdit ? 'Edit Monitor' : 'Add Monitor'}
        </h1>
        <p className="text-gray-400 mt-1">
          {isEdit
            ? 'Update monitor configuration'
            : 'Add a new monitor to your status page'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My Website"
            />
          </div>

          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-300"
            >
              Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {MONITOR_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-300"
            >
              URL / Address
            </label>
            <input
              id="url"
              name="url"
              type="text"
              required
              value={formData.url}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                formData.type === 'http'
                  ? 'https://example.com'
                  : formData.type === 'tcp'
                  ? 'example.com:443'
                  : 'example.com'
              }
            />
          </div>

          <div>
            <label
              htmlFor="group"
              className="block text-sm font-medium text-gray-300"
            >
              Group (optional)
            </label>
            <input
              id="group"
              name="group"
              type="text"
              value={formData.group}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Infrastructure"
            />
          </div>

          <div className="flex items-center">
            <input
              id="public"
              name="public"
              type="checkbox"
              checked={formData.public}
              onChange={handleChange}
              className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <label htmlFor="public" className="ml-2 text-sm text-gray-300">
              Show on public status page
            </label>
          </div>
        </div>

        {/* Test section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Test Monitor</h3>
              <p className="text-sm text-gray-400 mt-1">
                Test the URL before saving
              </p>
            </div>
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !formData.url}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? 'Testing...' : 'Test'}
            </button>
          </div>

          {testResult && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                testResult.success
                  ? 'bg-green-500/10 border border-green-500'
                  : 'bg-red-500/10 border border-red-500'
              }`}
            >
              {testResult.success ? (
                <div className="text-green-400">
                  ✓ Success - Response time: {testResult.responseTime}ms
                </div>
              ) : (
                <div className="text-red-400">✗ Failed: {testResult.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/admin/monitors')}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Monitor'}
          </button>
        </div>
      </form>
    </div>
  );
}
