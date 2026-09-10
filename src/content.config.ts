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
    image: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),
    translations: z.string().default(""),
  }),
});

export const collections = { blog };