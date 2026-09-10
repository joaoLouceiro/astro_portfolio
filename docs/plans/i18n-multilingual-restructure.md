# Plan: Bilingual (pt/en) i18n Restructure

**Status:** In progress
**Date:** 2026-08-06
**Owner:** João / build agent
**Scope:** Layout only — this document describes the target structure. No `src/` changes are included here.

## Context

This is a personal website + blog built with Astro (`astro@^7.0.6`). It is currently
static and mostly English, with a partial `i18n` config (`locales: ["es", "en", "pt"]`,
`defaultLocale: "en"`) and blog posts stored as plain `.md` files under
`src/pages/posts/` read via `import.meta.glob`.

The site must become fully bilingual (**Portuguese** and **English**):

1. Default language is **Portuguese**.
2. If the browser's language is one of the available languages, default to that language.
3. A button lets the user switch the website's language.
4. Switching language on an open page sends the user to *the same page* in the chosen language.
5. Blog posts exist in both languages, and routes are **translated** (not identical). E.g.
   - EN route: `/en/blog/handmade-containers`
   - PT route: `/pt/blog/containers-artesanais`
   The routing must smartly detect that correspondence.

## Decisions (confirmed with owner)

- **URL structure:** `prefixDefaultLocale: true` → uniform prefixed URLs: `/pt/…` and `/en/…`.
- **Browser-language detection:** keep the site **static**, implement via a client-side redirect
  on the root page (no SSR/adapter, no middleware, no `Astro.preferredLocale`).
- **Translated post slugs:** use **content collections** with a `translations` frontmatter field
  that cross-links each post to its sibling-language entry; resolve the counterpart with
  `getEntry`.

## Configuration

Update the `i18n` block in `astro.config.mjs`:

```js
i18n: {
  locales: ["pt", "en"],
  defaultLocale: "pt",
  routing: { prefixDefaultLocale: true },
},
```

- Remove `"es"`; set default to `"pt"`.
- No `redirectToDefaultLocale` — the root is handled manually for browser detection.
- Site stays 100% static.

## Directory layout

```
src/
  content.config.ts              # NEW blog collection (glob loader + schema)
  content/blog/
    pt/containers-artesanais.md
    en/handmade-containers.md
    # ... other posts, one file per language
  i18n/
    ui.ts                        # languages, defaultLang, string dict, lang names
    utils.ts                      # t(), getLangFromUrl(), translation lookup helpers
  layouts/
    BaseLayout.astro              # lang={Astro.currentLocale}, <LanguagePicker>, localized strings
    MarkdownPostLayout.astro      # collection-based pagination + translations
    MarkdownPage.astro
  components/
    Header.astro                  # localized nav
    Footer.astro
    BlogPost.astro                # CollectionEntry<'blog'>, per-language href
    Tags.astro
    LanguagePicker.astro          # NEW: language switch button
  pages/
    index.astro                   # root: client-side browser-language redirect
    pt/  index.astro  blog.astro  about.md  tags/index.astro  tags/[tag].astro
    en/  index.astro  blog.astro  about.md  tags/index.astro  tags/[tag].astro
    [lang]/blog/[slug].astro      # single dynamic post route for both languages
    rss.xml.js                    # scope to collection, per-language
```

### Why `[lang]/blog/[slug].astro`?

Both languages share identical post markup. A single dynamic route with
`getStaticPaths()` over the collection avoids duplicating render logic in `pt/` and `en/`.
`entry.id` is `"pt/containers-artesanais"` (or `"en/handmade-containers"`), so
`lang = id.split("/")[0]` and `slug = id.split("/")[1]`.

## Content collection schema (`src/content.config.ts`)

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string().default(""),
    author: z.string().default("João Louceiro"),
    tags: z.array(z.string()).default([]),
    // id of the sibling-language entry, e.g. "en/handmade-containers"
    translations: z.string().default(""),
  }),
});

export const collections = { blog };
```

The `translations` field is the **smart slug correspondence**:

- `pt/containers-artesanais.md` → `translations: "en/handmade-containers"`
- `en/handmade-containers.md` → `translations: "pt/containers-artesanais"`

Resolve the counterpart with `getEntry("blog", post.data.translations)`.

## Requirement-to-implementation mapping

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Default is Portuguese | `defaultLocale: "pt"`; PT files under `/pt/` |
| 2 | Browser language defaults | Root `index.astro` client-side `navigator.languages` check → redirect to `/en/` or `/pt/`; `<noscript>` falls back to `/pt/` |
| 3 | Language switch button | New `LanguagePicker.astro` in the `Header` |
| 4 | Switch keeps same page | Normal pages: `Astro.currentLocale` + `getRelativeLocaleUrl` (respects `prefixDefaultLocale`). Post pages: use `translations` |
| 5 | Translated post routes | Per-language files + `translations` field; `[lang]/blog/[slug]` resolves the sibling via `getEntry` |

## Supporting changes

- `BaseLayout`: set `lang={Astro.currentLocale}`, replace hardcoded `lang="en"`, localize page
  title and strings via `i18n/ui.ts`.
- `MarkdownPostLayout`: replace `import.meta.glob` with `getCollection`; pagination becomes
  per-language; pass `translations` to the picker.
- `BlogPost.astro`: accept `CollectionEntry<"blog">`; build `/pt/blog/<slug>` per language.
- `Tags.astro`: tag slugs are shared vocabulary (kept identical); links become locale-aware.
- `rss.xml.js`: scope to the collection, set `<language>` from current locale (optionally one
  feed per locale).
- Migrate existing posts (`post-1..4`, `2026-07-16`, etc.) into `src/content/blog/{pt,en}/`,
  each gaining a sibling translation + `translations` frontmatter. Current
  `handmade-container.md` body is Portuguese → becomes `pt/containers-artesanais.md`, with an
  `en/handmade-containers.md` counterpart to be written.

## Verification

1. `astro dev` starts cleanly (background mode per `AGENTS.md`).
2. Browse `/` → redirects to `/en/` or `/pt/` based on browser.
3. Visit `/pt/` and `/en/`; each shows the same pages in the correct language.
4. Open `/pt/blog/containers-artesanais` → language switch goes to `/en/blog/handmade-containers`
   and vice-versa.
5. Normal pages (about, blog list) switch to the same page in the other language.
6. `npm run build` completes without errors.

## Known risks / notes

- Only posts with **both** language files render a working switch button; one-sided posts hide
  the missing counterpart (graceful fallback).
- Requires `astro:i18n` helpers, which depend on the `i18n` config being active.
- Tag vocabulary is shared across languages (not translated) in this iteration.

## Handoff

This file is the single source of truth for the build agent. Implement in order:
config → content collection + migrate posts → `i18n/` ui+utils → layouts/components → pages →
rss → verify with `astro dev`.

## Progress log

- **2026-08-07 — [DONE]** `astro.config.mjs` already had the target i18n block
  (`locales: ["en", "pt"]`, `defaultLocale: "pt"`, `routing: { prefixDefaultLocale: true }`).
- **2026-08-07 — [DONE]** Created `src/i18n/ui.ts` (languages, `defaultLang`, `showDefaultLang`,
  `Lang` type, `ui` dict) and `src/i18n/utils.ts` (`getLangFromUrl`, `useTranslations`,
  `getRelativeLocaleUrl `). `showDefaultLang=true` to match `prefixDefaultLocale`.
- **2026-08-07 — [DONE]** Created `src/content.config.ts` (glob loader + zod schema with
  `translations` field) and migrated all posts into `src/content/blog/{pt,en}/`. Post **bodies are
  not translated** (owner decision): `containers-artesanais.md` stays PT, the English posts stay in
  `en/`. No `translations` frontmatter is set yet, so post pages hide the language switch
  (graceful fallback).
- **2026-08-07 — [DONE]** Rewrote `BaseLayout` (`lang={Astro.currentLocale}`), `Header`/`Footer`
  (localized via `useTranslations`), `BlogPost` (takes `CollectionEntry<'blog'>`, href via
  `getPostHref`), `Tags` (locale-aware links), added `LanguagePicker.astro`, and rewrote
  `MarkdownPostLayout` to paginate per-language from the collection and pass the sibling URL
  (`getEntry` on `translations`) to the picker.
- **2026-08-07 — [DONE]** Replaced root pages with localized trees:
  - `index.astro` — client-side browser-language redirect (`navigator.languages`) + `<noscript>`
    fallback to `/pt/`.
  - `pt/` and `en/`: `index.astro`, `blog.astro`, `about.md`, `tags/index.astro`, `tags/[tag].astro`
    (tag paths filtered per language).
  - `[lang]/blog/[slug].astro` — single dynamic post route via `getStaticPaths()` + `render()`.
  - `rss.xml.js` — now scoped to the `blog` collection (`getPostHref` links).
  Removed old `src/pages/posts/`, `blog.astro`, `about.md`, and root `tags/`.
- **2026-08-07 — [DONE]** Verified: `astro build` completes cleanly (25 pages), all key routes
  return 200 in dev, page-to-page language switch works (`/pt/`↔`/en/`, `/en/about/`→`/pt/about/`),
  and single-language posts hide the switch.

**Next up (when content is ready):**
1. Add `translations` frontmatter to paired posts (e.g. `pt/containers-artesanais` ↔
   `en/handmade-containers`) so the post-page language switch activates.
2. Translate page copy (`about.md`, home/blog/tags strings already keyed in `ui.ts`).