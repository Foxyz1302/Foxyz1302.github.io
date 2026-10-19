# App developer card: feed and embed

Two ways the site shows up outside itself:

1. **Card feed** `/card/v1.json`: small JSON the in-app developer card
   (a future Flutter package) reads at runtime, so donation options,
   commission status and links change without an app release.
2. **Embed** `/embed/<app>/` and `/embed.js`: an app card with Download and
   Support buttons that other pages can include.

Both are generated from `public/data.json` on every build
(`src/lib/card.ts`, `src/views/Embed.astro`).

## Card feed

URL: `https://<site>/card/v1.json` (today `https://foxyz.ru/card/v1.json`).

### Versioning contract

- The version is in the path. `v1` only ever **gains** fields.
- Renaming or removing a field, or changing its type or meaning, needs a new
  path (`/card/v2.json`). The site keeps building `v1` for as long as
  released apps read it.
- Apps ignore fields they do not know and treat a missing optional field as
  "not shown".
- `schema` inside the file repeats the major version (`1`).

### Schema (v1)

`L10n` is an object of language code → string, e.g.
`{"en": "Support", "ru": "Поддержать"}`. Always an object, `en` always
present. Pick the app's language, fall back to `en`. All URLs are absolute.

```jsonc
{
  "schema": 1,                       // int, major version of this format
  "updated": "2026-10-18T18:22:32Z", // ISO 8601 build time
  "refreshAfterHours": 24,           // int, how long a cached copy stays fresh
  "developer": {
    "name": "Foxyz",                 // string
    "role": L10n,
    "pitch": L10n,
    "avatar": "https://…/avatar-256.png", // PNG, square, 256 px
    "website": L10n                  // site home per language
  },
  "commissions": {
    "status": "open",                // "open" | "limited" | "closed"
    "slots": 2,                      // int or null (unknown/hidden)
    "note": L10n,                    // optional
    "url": L10n                      // commissions page per language
  },
  "support": {
    "url": L10n,                     // support page per language
    "order": { "en": ["kofi", …], "ru": [ … ] }, // option ids per language; unknown language → "en"
    "options": [
      { "id": "kofi", "kind": "link", "name": L10n, "note": L10n, "url": "https://ko-fi.com/foxyz" },
      { "id": "usdt-trc20", "kind": "crypto", "name": L10n, "note": L10n,
        "network": "TRC20 (TRON)", "address": "T…" }
    ]                                // "kind" may gain new values: skip unknown kinds
  },
  "contact": [
    { "id": "discord", "label": "Discord", "value": "foxyz", "url": "https://discord.com/users/foxyz" }
  ],
  "apps": [
    { "id": "starsync", "name": "Starsync", "status": "released",
      "pitch": L10n, "icon": "https://…/icon.png",
      "platforms": ["linux", "windows"],
      "url": L10n,                   // app page per language
      "embed": "https://…/embed/starsync/" }
  ]
}
```

Placeholders from `data.json` (`"placeholder": true`) never appear in the feed, and `apps` lists only released apps.

### Caching expectations (for the app)

- Ship a copy of the feed inside the app (asset) as the first fallback.
- On start, show the cached copy at once; never wait for the network.
- Refetch in the background when the cached copy is older than
  `refreshAfterHours` (and at most once per app start). Use a short timeout
  (about 5 s); on any error keep the old copy.
- Save the response only if it parses and `schema == 1`. A file with a
  higher `schema` at the v1 path should not happen; ignore it if it does.
- GitHub Pages serves it with `Cache-Control: max-age=600` and an `ETag`;
  sending `If-None-Match` is a nice extra, not required.
- The card is never shown unasked: the app opens it from its "made by
  Foxyz" signature (see the brief).

### Reading it in Dart

```dart
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

const feedUrl = 'https://foxyz.ru/card/v1.json';

/// Picks the text for [lang], falling back to English.
String l10n(Object? m, String lang) =>
    m is Map ? (m[lang] ?? m['en'] ?? '') as String : '';

class DevCardFeed {
  DevCardFeed(this.cacheFile, this.bundledJson);

  final File cacheFile;      // e.g. <app support dir>/dev_card_v1.json
  final String bundledJson;  // rootBundle.loadString('assets/dev_card_v1.json')

  /// What to show right now: the cached copy, else the bundled one.
  Future<Map<String, dynamic>> current() async {
    try {
      return _parse(await cacheFile.readAsString());
    } catch (_) {
      return _parse(bundledJson);
    }
  }

  /// Refreshes the cache in the background when it is stale.
  Future<void> refreshIfStale() async {
    final cur = await current();
    final hours = (cur['refreshAfterHours'] as int?) ?? 24;
    final age = await cacheFile.exists()
        ? DateTime.now().difference(await cacheFile.lastModified())
        : const Duration(days: 365);
    if (age < Duration(hours: hours)) return;
    try {
      final res = await http.get(Uri.parse(feedUrl)).timeout(const Duration(seconds: 5));
      if (res.statusCode != 200) return;
      final body = utf8.decode(res.bodyBytes);
      _parse(body); // throws if broken or a different schema
      await cacheFile.writeAsString(body);
    } catch (_) {
      // offline or broken: keep the old copy
    }
  }

  static Map<String, dynamic> _parse(String s) {
    final m = jsonDecode(s) as Map<String, dynamic>;
    if (m['schema'] != 1) throw const FormatException('unknown card schema');
    return m;
  }
}

// Usage:
//   final feed = DevCardFeed(file, bundled);
//   final card = await feed.current();
//   unawaited(feed.refreshIfStale());
//   final c = card['commissions'];
//   Text(c['status'] == 'open' ? 'Open for commissions' : 'Commissions closed');
//   final lang = 'ru';
//   final order = (card['support']['order'][lang] ?? card['support']['order']['en']) as List;
```

## Embed

### iframe

```html
<iframe src="https://foxyz.ru/embed/starsync/"
        title="Starsync" style="border:0;width:100%;max-width:424px;height:200px"></iframe>
```

- Russian: `/ru/embed/starsync/`. Light pages: add `?theme=light`.
- The card is transparent around its rounded corners, links open in a new tab.
- The Download button picks the visitor's system like the app page does.

### Script snippet (auto height)

```html
<script src="https://foxyz.ru/embed.js" data-app="starsync" async></script>
<!-- options: data-lang="ru", data-theme="light" -->
```

`embed.js` inserts the iframe right after the script tag and resizes it to
the card's height (the card posts `{type: "foxyz-embed:height", height}` to
its parent). The snippet is under 1 KB and has no dependencies.

App stores that allow neither iframes nor scripts (most of them) get a plain
link to `/apps/<id>/` and the site's link preview instead.
