import { defineConfig } from '@playwright/test';

// Serve the folder exactly as GitHub Pages would: plain static files, no build.
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:4318' },
  webServer: {
    command: 'npx http-server . -p 4318 -c-1 --silent',
    url: 'http://localhost:4318/index.html',
    reuseExistingServer: false,
  },
});
