import express from 'express';
import path from 'path';
import fs from 'fs';
import apiRouter from './server/api.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // API routes FIRST
  app.use('/api', apiRouter);

  // Serve compiled production assets if dist directory exists
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite dev server not available, and dist/index.html not found:', viteErr);
      app.get('*', (_req, res) => {
        res.status(500).send('Application build missing. Please run `npm run build`.');
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FaceVote server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting FaceVote server:', err);
  process.exit(1);
});


