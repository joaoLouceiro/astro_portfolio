import { ui, defaultLang, showDefaultLang, type Lang } from "./ui";

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)["pt"]) {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

export function getRelativeLocaleUrl(lang: Lang, path: string = ""): string {
  const prefix = lang === defaultLang && !showDefaultLang ? "" : `/${lang}`;
  return `${prefix}${path}`;
}

export function getPostHref(id: string): string {
  const [lang, ...rest] = id.split("/");
  return `/${lang}/blog/${rest.join("/")}`;
}

export function getOtherLang(lang: Lang): Lang {
  return lang === "pt" ? "en" : "pt";
}
