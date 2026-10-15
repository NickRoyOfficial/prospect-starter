import { defineConfig, devices } from "@playwright/test"
export default defineConfig({
  testDir: "./e2e", workers: 1, reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173", headless: true,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] },
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "short", use: { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" } },
  ],
  webServer: { command: "npm run dev -- --port 5173 --strictPort", url: "http://127.0.0.1:5173", reuseExistingServer: false },
})
