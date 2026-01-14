import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createAdminApi, type AppSettings, type NotificationSettings } from '../../services/admin-api';

export function SettingsPage() {
  const { accessToken } = useAuth();

  const [appSettings, setAppSettings] = useState<AppSettings>({
    title: '',
    description: '',
    logo_url: '',
    timezone: 'UTC',
    noindex: true,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    webhook_url: '',
    cooldown: 300,
    template: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      if (!accessToken) return;

      const api = createAdminApi(() => accessToken);

      try {
        const settings = await api.getSettings();
        setAppSettings({
          title: settings.app?.title || '',
          description: settings.app?.description || '',
          logo_url: settings.app?.logo_url || '',
          timezone: settings.app?.timezone || 'UTC',
          noindex: settings.app?.noindex ?? true,
        });
        setNotificationSettings({
          webhook_url: settings.notifications?.webhook_url || '',
          cooldown: settings.notifications?.cooldown ?? 300,
          template: settings.notifications?.template || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [accessToken]);

  const handleAppChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setAppSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setSuccess('');
  };

  const handleNotificationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    const api = createAdminApi(() => accessToken);

    try {
      await api.updateSettings(appSettings, notificationSettings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-gray-400 text-center py-8">Loading settings...</div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your status page</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* App Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">General</h2>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={appSettings.title}
              onChange={handleAppChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My Status Page"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={appSettings.description}
              onChange={handleAppChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Status of our services"
            />
          </div>

          <div>
            <label
              htmlFor="logo_url"
              className="block text-sm font-medium text-gray-300"
            >
              Logo URL (optional)
            </label>
            <input
              id="logo_url"
              name="logo_url"
              type="url"
              value={appSettings.logo_url}
              onChange={handleAppChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-gray-300"
            >
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={appSettings.timezone}
              onChange={handleAppChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Chicago">America/Chicago</option>
              <option value="America/Denver">America/Denver</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
              <option value="Asia/Shanghai">Asia/Shanghai</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="noindex"
              name="noindex"
              type="checkbox"
              checked={appSettings.noindex}
              onChange={handleAppChange}
              className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <label htmlFor="noindex" className="ml-2 text-sm text-gray-300">
              Hide from search engines (noindex)
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>

          <div>
            <label
              htmlFor="webhook_url"
              className="block text-sm font-medium text-gray-300"
            >
              Webhook URL (optional)
            </label>
            <input
              id="webhook_url"
              name="webhook_url"
              type="url"
              value={notificationSettings.webhook_url}
              onChange={handleNotificationChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://hooks.slack.com/services/..."
            />
            <p className="mt-1 text-sm text-gray-400">
              Receive notifications when monitors go down
            </p>
          </div>

          <div>
            <label
              htmlFor="cooldown"
              className="block text-sm font-medium text-gray-300"
            >
              Cooldown (seconds)
            </label>
            <input
              id="cooldown"
              name="cooldown"
              type="number"
              min={0}
              value={notificationSettings.cooldown}
              onChange={handleNotificationChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-400">
              Minimum time between notifications for the same monitor
            </p>
          </div>

          <div>
            <label
              htmlFor="template"
              className="block text-sm font-medium text-gray-300"
            >
              Message Template (optional)
            </label>
            <textarea
              id="template"
              name="template"
              rows={4}
              value={notificationSettings.template}
              onChange={handleNotificationChange}
              className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder={'{"text": "{{monitor.name}} is {{status}}"}'}
            />
            <p className="mt-1 text-sm text-gray-400">
              JSON payload for the webhook. Use {`{{monitor.name}}`} and {`{{status}}`} placeholders.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
