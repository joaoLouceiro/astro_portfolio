export const languages = {
  pt: "Português",
  en: "English",
} as const;

export const defaultLang = "pt";

export const showDefaultLang = true;

export type Lang = keyof typeof languages;

export const ui = {
  pt: {
    "nav.about": "Sobre",
    "nav.blog": "Blog",
    "nav.tags": "Tags",
    "footer.rights": "©2026 João Louceiro",
    backHome: "Voltar ao início",
    "home.title": "Bem-vindo",
    "home.intro":
      "Esta é a minha página pessoal. É aqui que divago, resmungo e, por vezes, tropeço.",
    "blog.title": "Blog",
    "blog.intro": "Onde escrevo sobre o que tenho aprendido.",
    "tags.title": "Tags",
    "tags.intro": "Todos os tópicos.",
    "tags.tagged": "Publicações marcadas com",
    "post.newer": "Publicação mais recente",
    "post.older": "Publicação mais antiga",
  },
  en: {
    "nav.about": "About",
    "nav.blog": "Blog",
    "nav.tags": "Tags",
    "footer.rights": "©2026 João Louceiro",
    backHome: "Back to home",
    "home.title": "Welcome",
    "home.intro":
      "This is my personal page. This is where I ramble, mumble, and, sometimes, stumble.",
    "blog.title": "Blog",
    "blog.intro": "Where I write about what I've been learning.",
    "tags.title": "Tags",
    "tags.intro": "All the topics.",
    "tags.tagged": "Posts tagged with",
    "post.newer": "Newer Post",
    "post.older": "Older Post",
  },
} as const;
