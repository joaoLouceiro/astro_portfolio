// @ts-check
import { defineConfig } from "astro/config";
import remarkBlocks from "remark-callout-plus/astro";

export default defineConfig({
  site: "https://jlouceiro.netlify.app/",
  integrations: [remarkBlocks()],
  markdown: {
    shikiConfig: {
      themes: {
        light: "everforest-light",
        dark: "everforest-dark",
      },
    },
  },
  i18n: {
    locales: ["pt", "en"],
    defaultLocale: "pt",
    routing: { prefixDefaultLocale: false },
  },
});
