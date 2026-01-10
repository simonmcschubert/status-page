import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ConfigLoader } from './config/loader.js';
import { MonitorRunner } from './monitors/runner.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load configurations
let appConfig;
let monitorsConfig;

try {
  appConfig = ConfigLoader.loadAppConfig();
  monitorsConfig = ConfigLoader.loadMonitorsConfig();
  console.log(`📋 Loaded ${monitorsConfig.monitors.length} monitors`);
} catch (error) {
  console.error('⚠️  Failed to load config files. Using example configs.');
  console.error('   Copy config.example.yml to config.yml and monitors.example.yml to monitors.yml');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api/config', (req, res) => {
  if (!appConfig) {
    return res.status(500).json({ error: 'Config not loaded' });
  }
  res.json({
    app: appConfig.app,
    ui: appConfig.ui,
  });
});

app.get('/api/monitors', (req, res) => {
  if (!monitorsConfig) {
    return res.status(500).json({ error: 'Monitors config not loaded' });
  }
  res.json({
    monitors: monitorsConfig.monitors.filter(m => m.public),
  });
});

app.get('/api/status', async (req, res) => {
  if (!monitorsConfig) {
    return res.status(500).json({ error: 'Monitors config not loaded' });
  }

  try {
    const results = await MonitorRunner.runChecks(monitorsConfig.monitors);
    res.json({
      timestamp: new Date().toISOString(),
      monitors: results.map(r => ({
        name: r.monitorName,
        success: r.success,
        responseTime: r.responseTime,
        error: r.error,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run checks' });
  }
});

app.get('/api/incidents', (req, res) => {
  res.json({ message: 'Incidents API - Coming soon' });
});

// Test endpoint to run checks manually
app.post('/api/test-check', async (req, res) => {
  if (!monitorsConfig) {
    return res.status(500).json({ error: 'Monitors config not loaded' });
  }

  try {
    const results = await MonitorRunner.runChecks(monitorsConfig.monitors);
    res.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Status Page server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test checks: POST http://localhost:${PORT}/api/test-check`);
});
