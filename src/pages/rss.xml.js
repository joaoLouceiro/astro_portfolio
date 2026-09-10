import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getPostHref } from "../i18n/utils";

export async function GET(context) {
  const posts = await getCollection("blog");
  const items = posts.map((post) => ({
    title: post.data.title,
    pubDate: post.data.pubDate,
    description: post.data.description,
    link: getPostHref(post.id),
  }));
  return rss({
    title: "jlouceiro | Blog",
    description: "My journey learning Astro",
    site: context.site,
    items: items,
    customData: `<language>pt</language>`,
  });
}
