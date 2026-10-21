import { defineConfig } from '@playwright/test';

// Serve the folder exactly as GitHub Pages would: plain static files, no build.
// SwiftShader gives headless Chromium a software WebGL so the 3D view can be tested.
export default defineConfig({
  testDir: './tests',
  workers: 1, // software WebGL is heavy; running files in parallel makes timing-based checks flaky
  use: {
    baseURL: 'http://localhost:4318',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npx http-server . -p 4318 -c-1 --silent',
    url: 'http://localhost:4318/index.html',
    reuseExistingServer: false,
  },
});
