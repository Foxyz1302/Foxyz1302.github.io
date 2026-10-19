# `public/data.json`

The one file with the site's content. The site reads it at build time; it is
also served as-is at `/data.json`, but apps must not read that: they read the
derived, stable [card feed](CARD-FEED.md). The TypeScript version of this
schema is in `src/lib/data.ts` (keep the two in step).

## Conventions

- **Text** (`Text` below) is either a plain string (same in every language)
  or `{ "en": "...", "ru": "..." }`. A missing language falls back to `en`.
- **`"placeholder": true`** on an item means "not decided yet". The site
  shows it with a dashed yellow outline and a `TODO` badge; the card feed
  leaves it out. Remove the flag once the item is real.
- Paths starting with `/` point into `public/` (e.g. `/apps/starsync/icon.svg`
  is `public/apps/starsync/icon.svg`).

## `site`

| Field | Type | Meaning |
|---|---|---|
| `url` | string | Public address, no trailing slash. Used for link previews, canonical links and the card feed. Change it together with `public/CNAME`. |
| `title` | string | Short site name in tab titles. |
| `description` | Text | Default page description for search and link previews. |
| `sourceRepo` | string? | Link in the footer. |

## `analytics`

| Field | Type | Meaning |
|---|---|---|
| `goatcounter` | string | The GoatCounter account code: `"foxyz"` sends visits to `https://foxyz.goatcounter.com`. Empty means no stats script at all. GoatCounter uses no cookies, so no consent banner is needed. Besides page views it counts clicks on buttons marked `data-goatcounter-click` (downloads `download-<app>[-<platform>]`, donation links `support-<id>`, address copies `copy-<id>`, contact links `hire-<id>` / `contact-<id>`, embed Support `embed-support-<app>`); they show up as events in the dashboard. |

## `person`

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Display name. |
| `role` | Text | One line under the name. |
| `pitch` | Text | The one-line pitch on Home. |
| `languages` | Text? | Shown on the CV. |
| `avatar` | string | Image on About. |

## `contact[]`

`{ id, label, value, url, placeholder? }`. `id` also picks the icon
(`discord`, `github`, `email`, `telegram`; others get a globe). Order is the
display order.

## `commissions`

| Field | Type | Meaning |
|---|---|---|
| `status` | `"open"` \| `"limited"` \| `"closed"` | Shown on Home, Commissions and in apps. |
| `slots` | number? | Free slots, hidden when closed. |
| `slotsPlaceholder` | bool? | Slots number not decided (the feed sends `null`). |
| `note` | Text? | One or two lines under the status. |
| `currency` | string | ISO code for prices, e.g. `USD`. |
| `prices[]` | `{ name: Text, from?: number, perHour?: number, text?: Text, placeholder? }` | Price guide cards; `text` (e.g. "By agreement") shows instead of an amount. |
| `contact` | string | `id` of the contact entry for the main button. |

Longer texts are Markdown: `src/content/<lang>/commissions.md`.

## `donations`

- `options[]`: `{ id, kind: "link" | "crypto", name: Text, note?: Text, placeholder?, preferred? }`
  plus `url` for links, or `network` and `address` for crypto (copy button
  and QR code are made from `address`).
- `order`: `{ "en": [ids], "ru": [ids] }`. The Support page and the card
  feed list options in this order for that language; an id not in a list is
  hidden in that language. Keep crypto last.

## `apps[]`

| Field | Type | Meaning |
|---|---|---|
| `id` | string | URL part: `/apps/<id>/`, `/embed/<id>/`. Never change it once apps use it. |
| `name` | string | |
| `status` | `"released"` \| `"in-development"` \| `"coming"` | Only `released` apps get a page, a Download button, an embed and a place in the card feed and on Home. The others show as small cards under "In the works" on the Apps page (no link, no download): `in-development` is labelled "Early version" (it runs, but is bare-bones), `coming` means not started yet. To release one: set `"released"` and add `icon`, `releases` (and `features`, `media`, `changelog`). |
| `mediaCredit` | Text? | Small credit line under the screenshots, e.g. the license of a film shown in them. |
| `workingTitle` | bool? | The name is not final; shown with a "working title" note. Not needed while `name` just says what the app does ("Pixiv app"). |
| `featured` | bool? | Shown on Home (first three released). |
| `placeholder` | bool? | |
| `icon` | string? | Square icon. Without one, generated art (initials on a violet tile) is drawn. If it is an `.svg`, put a `.png` with the same name next to it: the card feed sends the PNG. |
| `pitch` | Text | One line. |
| `description` | Text? | A paragraph on the app page. |
| `platforms` | string[] | `linux`, `windows`, `macos`, `android`, `ios`, `web`. |
| `tags` | string[]? | Chips on the app page. |
| `features` | `{ en: string[], ru: string[] }`? | |
| `requirements` | Text? | |
| `media[]` | `{ type: "image" \| "video" \| "youtube", src, alt?: Text, placeholder? }` | Screenshots strip. `youtube` takes a video URL or id. |
| `releases.sources[]` | `{ type: "github", repo }` or `{ type: "gitea", host, repo }` | Where the latest release is read at build time; the first source that answers wins. |
| `releases.assets` | `{ "<platform>-<arch>": "<end of file name>" }` | Which release file is which, e.g. `"linux-x64": "-linux-x64.tar.gz"`. The part before `-` is matched against the visitor's system. |
| `changelog.url` | string? | Raw `CHANGELOG.md` (`## <version>`, `### Added/Changed/Fixed`, `- item`). |
| `changelog.show` | number? | How many versions to show (default 3). |

## `resume`

`summary: Text`, `skills[]: { group: Text, items: Text[] }`,
`timeline[]: { when: Text, what: Text, detail?: Text, placeholder? }`. Used by
About and the printable CV (`/about/cv/`). The free-text part of About is
`src/content/<lang>/about.md`.
