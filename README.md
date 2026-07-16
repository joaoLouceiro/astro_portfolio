# My Portfolio/Blog/Website

This is my personal website. Feel free to steal away.

It is based on the Astro web framework's starter template.

## Why Astro?

Astro does away with a lot of the overcomplicatedness of most JavaScript frameworks, while allowing us to use a pretty familiar syntax. I have just scratched the surface, but it feels like a breeze to work with.

I have also been struggling a lot with how these frameworks tend to work with the browser. These programs are extremely optimized for HTML processing, and yet, because we strip them away of their capabilities and shoehorn a new rendering engine on top of it, just so we can use a half-baked coding language on top of it. Or maybe I was just brainwashed by the [Hypermedia Systems](https://hypermedia.systems/) book.

## Project Structure

```text
/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │   └── index.astro
│   ├── scripts/
│   └── styles/
└── package.json
```

This is all pretty standard stuff, but here it goes:

- `public/` is where I put static assets like images.
- `src/assets` is another place for stuff like images. I am still trying to figure out if I want to use this or `public/`. Check [this article](https://docs.astro.build/en/guides/images/#where-to-store-images) for more details;
- `src/components` is the default location for Astro/React/Vue/Svelte/Preact components.
- `src/layouts` is where I keep my... Well, layouts. These are like scaffoldings for a page.
- `src/scripts` any JavaScript scripts live here.
- `src/styles` is for CSS.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
