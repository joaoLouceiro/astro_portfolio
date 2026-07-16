// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://jlouceiro.netlify.app/",
  markdown: {
    shikiConfig: {
      themes: {
        light: "everforest-light",
        dark: "everforest-dark",
      },
    },
  },
});
