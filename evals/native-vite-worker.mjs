// Separate processes keep Vite dev/build NODE_ENV and project plugins out of the eval host.
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';

const [mode, project, config, destination] = process.argv.slice(2);
let server, http;
try {
  const vite = await import(pathToFileURL(path.join(project, 'node_modules/vite/dist/node/index.js')).href);
  const version = JSON.parse(fs.readFileSync(path.join(project, 'node_modules/vite/package.json'), 'utf8')).version;
  if (mode === 'serve') {
    // Vite treats configured port 0 as its default port. Node's HTTP listener owns a real
    // ephemeral loopback port; Vite's documented middleware API retains the project config.
    http = createServer();
    await new Promise((resolve, reject) => { http.once('error', reject); http.listen(0, '127.0.0.1', resolve); });
    const port = http.address().port;
    server = await vite.createServer({ root: project, configFile: config, clearScreen: false, server: { middlewareMode: true, watch: null, hmr: { server: http, host: '127.0.0.1', port, clientPort: port }, open: false } });
    http.on('request', server.middlewares);
    let stopping = false;
    const stop = async () => { if (stopping) return; stopping = true; http.closeAllConnections(); await Promise.all([new Promise(resolve => http.close(resolve)), server.close()]); process.exit(0); };
    process.on('SIGTERM', stop); process.on('disconnect', stop);
    process.send({ url: `http://127.0.0.1:${port}/`, version, transport: 'owned HTTP/WebSocket port; file watching disabled' });
  } else if (mode === 'build') {
    await vite.build({ root: project, configFile: config, clearScreen: false, build: { outDir: destination, emptyOutDir: false } });
    process.send({ version });
  } else throw new Error('Unknown native Vite worker mode');
} catch (error) { console.error(error.stack); http?.closeAllConnections(); http?.close(); await server?.close(); process.exitCode = 1; }
