import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const DEFAULT_VAST_URL =
  'https://crookedagreement.com/d.mjF/zTd/G/NYvxZDG/UW/Fe/mk9iuRZbUbl/krP/T/cD0EMXjyMg3/NRjrk/tEN/zuQdyrMIzucE3wMIwL';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // VAST Proxy API to eliminate browser CORS restrictions and forward client headers
  app.get('/api/vast', async (req, res) => {
    const targetUrl = (req.query.url as string) || DEFAULT_VAST_URL;
    const clientUserAgent =
      (req.headers['user-agent'] as string) ||
      'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    const clientReferer = (req.headers['referer'] as string) || 'https://crookedagreement.com';
    const forwardIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': clientUserAgent,
          Referer: clientReferer,
          Accept: 'text/xml, application/xml, text/html, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`Upstream VAST returned status ${response.status}`);
      }

      const xmlText = await response.text();
      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(xmlText);
    } catch (err) {
      console.warn('[Server VAST Proxy Warning]:', err);
      res.status(502).json({
        error: 'Failed to fetch VAST from upstream server',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
