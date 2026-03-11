import { defineConfig } from 'astro/config';

export default defineConfig({
  // i18n設定 (Astro 4.0以降)
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
