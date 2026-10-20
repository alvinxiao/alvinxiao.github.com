import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import { readReleaseConfig, releaseIssues } from './scripts/check-release.mjs';
const config = readReleaseConfig();
export default defineConfig({
  site: config.siteUrl,
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    plugins: [
      {
        name: 'approved-production-release',
        configResolved(viteConfig) {
          if (viteConfig.command === 'build' && viteConfig.mode === 'production') {
            const issues = releaseIssues(config);
            if (issues.length) throw new Error(`Production release blocked:\n${issues.join('\n')}`);
          }
        },
      },
      tailwind(),
    ],
  },
});
