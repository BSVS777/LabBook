import { createApp } from './app.js';
import { loadConfig } from './config/env.js';

const config = loadConfig();
const app = createApp(config);

const server = app.listen(config.port, () => {
  console.info(`API listening on port ${String(config.port)}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    `API failed to listen on port ${String(config.port)}: ${error.code ?? error.message}`,
  );
  process.exit(1);
});
