import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'local-api',
          configureServer(server) {
            server.middlewares.use('/api/analyze-soil', async (req, res) => {
              const mod = await server.ssrLoadModule('/api/analyze-soil.ts');
              return mod.default(req, res);
            });
          },
        },
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
