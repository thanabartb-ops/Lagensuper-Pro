import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getGatewayStatus, executeGeminiPrompt } from './server/geminiService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'LSUPERAGENT V11 Runtime' });
  });

  // API Route: Runtime Status Check (Never returns secrets)
  app.get('/api/runtime/status', (_req, res) => {
    try {
      const status = getGatewayStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({
        connected: false,
        statusText: 'PROVIDER_ERROR',
        error: 'Failed to retrieve gateway status',
      });
    }
  });

  // API Route: Execute Gemini Prompt Server-Side
  app.post('/api/runtime/execute', async (req, res) => {
    try {
      const { prompt, route } = req.body || {};
      const result = await executeGeminiPrompt(prompt, route);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        status: 'PROVIDER_ERROR',
        message: 'Internal server error during prompt execution.',
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LSUPERAGENT Runtime] Server running on port ${PORT}`);
  });
}

startServer();
