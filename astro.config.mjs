// @ts-check
import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";

export default defineConfig({
  site: "https://jlouceiro.netlify.app/",
  integrations: [preact()],
});