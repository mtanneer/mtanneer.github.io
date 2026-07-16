# mtanneer.github.io

**COPYRIGHT**. Please [email me](mailto:tmanas9@gmail.com) before you use any of the source code. Please put the words **Website on Github** in the subject so I can find it easier!

Personal site built with [Astro](https://astro.build), Tailwind CSS, and a D3-powered interactive site graph.

## Files
```
mtanneer.github.io
│   README.md
│   package.json
│   astro.config.mjs
│   tsconfig.json
│   playwright.config.ts
│
└─── src
│   └─── pages           routes: index, about, contact, projects/
│   └─── layouts         Layout.astro
│   └─── components      SiteGraph.astro
│   └─── content         content collections (projects/*.md)
│   └─── lib             site.ts, graph.ts, github.ts
│   └─── styles          global.css
│
└─── public              static assets (favicon, robots.txt)
│
└─── tests               Playwright e2e specs
│
└─── .github/workflows   deploy.yml, test.yml
│
└─── legacy              old static HTML/CSS/JS site (kept for reference)
```

## Development
```
npm install
npm run dev        # local dev server
npm run build      # production build to dist/
npm run preview    # preview the build
npm run test:e2e   # Playwright e2e tests
```

## Notes
- Content (projects) lives as Markdown in `src/content/projects/`, validated by `src/content.config.ts`.
- `legacy/` is the previous non-Astro version of the site, kept only for reference — not built or deployed.
- CI runs Playwright tests on push via `.github/workflows/test.yml`; deploys via `.github/workflows/deploy.yml`.

## Create Your Own GitHub Pages Site
Find information [here](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) on how to make your own, hosted by GitHub, webpage.
