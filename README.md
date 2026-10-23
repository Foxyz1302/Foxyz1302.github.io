# Foxyz site

Personal site of Foxyz: apps, commissions, resume and support. English and
Russian. Built with [Astro](https://astro.build) into plain static files and
published on GitHub Pages.

## Edit content

Almost everything is in two places; no code needed.

| What | Where |
|---|---|
| Apps, links and contacts, donation options and their order, commission status and prices, resume skills and timeline | `public/data.json` (fields: [docs/DATA.md](docs/DATA.md)) |
| Longer texts: Commissions, About, Support intro | `src/content/en/*.md` and `src/content/ru/*.md` (Markdown; title and lead in the `---` block on top) |
| Buttons, menu and headings | `src/i18n/ui.ts` |
| Colours, fonts, sizes | the variables at the top of `src/styles/global.css` |
| Images (app icons, screenshots) | `public/` (e.g. `public/apps/<id>/`), then point to them from `data.json` as `/apps/<id>/file.png` |

Typical edits:

- **Close commissions:** `commissions.status` → `"closed"` (or `"limited"`).
- **Add an app:** copy the Starsync entry in `apps`, change `id`, texts,
  `icon`, `platforms`, `releases` and `changelog`. Its page appears at
  `/apps/<id>/`.
- **Add a donation option:** add it to `donations.options`, then put its id
  in `donations.order.en` and/or `donations.order.ru` where it should show.
- Anything marked `"placeholder": true` shows a yellow `TODO` badge on the
  site and is left out of the app feed. Remove the flag when it is real.

App downloads and changelogs are read at build time from the release
sources in `data.json` (GitHub first, then Gitea). The Download button then
picks the visitor's system in the browser. Rebuilding (any push, the daily
scheduled build, or "Run workflow") picks up new releases.

## Run it locally

Needs Node.js 22.22 or newer.

```sh
npm install        # once
npm run dev        # http://localhost:4321, reloads on save
npm run build      # makes the final site in dist/
npm run preview    # serves dist/ to check the build
```

## Publish

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds the
site and publishes it to GitHub Pages; it also rebuilds daily and has a
"Run workflow" button in the Actions tab.

One-time switch (not done yet): repo **Settings → Pages → Build and
deployment → Source: GitHub Actions**. Until then Pages keeps serving the
files of the branch as they are. After switching, check that the custom
domain is still set in Settings → Pages and tick **Enforce HTTPS** once the
certificate is issued. `public/CNAME` holds the domain too; when the domain
changes, edit it and `site.url` in `data.json`.

## Card feed and embed

- `/card/v1.json` is the feed the in-app developer card reads: developer,
  commission status, support options per language, contacts, apps. It is
  built from `data.json`; its format is a promise to released apps, so read
  [docs/CARD-FEED.md](docs/CARD-FEED.md) before changing `src/lib/card.ts`.
- `/embed/<app>/` is a small app card (Download + Support) for an iframe;
  `/embed.js` inserts it with automatic height:

  ```html
  <script src="https://foxyz.ru/embed.js" data-app="starsync" async></script>
  ```

Details, the Dart example and caching rules: [docs/CARD-FEED.md](docs/CARD-FEED.md).

## Layout

```
public/data.json        content
public/                 images, icons, CNAME, embed.js (copied as-is)
public/brand/           the logo (logo.svg, plus webp/png) and square mark (mark.svg, plus
                        webp/png); made in ../logo-concepts/round7/source (build.py), see that folder
src/content/<lang>/     Markdown texts
src/i18n/ui.ts          short interface texts
src/views/              one file per page (Home, Apps, AppPage, Commissions, About, Cv, Support, Embed)
src/pages/              URLs: each file just shows a view in a language (ru/ = Russian)
src/components/         header, footer, app card, download button, icons
src/lib/                reading data.json, releases and changelogs, the card feed
src/styles/global.css   the look
```
