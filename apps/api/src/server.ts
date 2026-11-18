import { createApp } from './app.js';
import { loadConfig } from './config/env.js';

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, () => {
  console.info(`API listening on port ${String(config.port)}`);
});
