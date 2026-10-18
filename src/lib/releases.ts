// Build-time lookups of an app's latest release and changelog.
// Everything here fails soft: if a source is down, the page still builds and
// shows a plain "releases" link instead of a direct download.
import type { App, ReleaseSource } from './data';

export interface ReleaseAsset {
  platform: string; // e.g. linux-x64
  name: string;
  url: string;
  size: number;
}

export interface Release {
  version: string; // without the leading v
  tag: string;
  date: string; // ISO
  pageUrl: string; // the release's web page
  listUrl: string; // all releases
  source: ReleaseSource['type'];
  assets: ReleaseAsset[];
}

const TIMEOUT_MS = 8000;

async function getJson(url: string): Promise<any | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': 'foxyz-site-build' };
    // In GitHub Actions a token lifts the API rate limit; locally it is not needed.
    if (url.startsWith('https://api.github.com') && process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function apiUrl(s: ReleaseSource): { api: string; list: string } {
  if (s.type === 'github') {
    return { api: `https://api.github.com/repos/${s.repo}/releases/latest`, list: `https://github.com/${s.repo}/releases` };
  }
  const host = (s.host ?? '').replace(/\/$/, '');
  return { api: `${host}/api/v1/repos/${s.repo}/releases/latest`, list: `${host}/${s.repo}/releases` };
}

const cache = new Map<string, Promise<Release | null>>();

/** The newest release of an app, from the first source in its list that answers. */
export function latestRelease(app: App): Promise<Release | null> {
  if (!app.releases) return Promise.resolve(null);
  if (!cache.has(app.id)) cache.set(app.id, fetchRelease(app));
  return cache.get(app.id)!;
}

async function fetchRelease(app: App): Promise<Release | null> {
  for (const source of app.releases!.sources) {
    const { api, list } = apiUrl(source);
    const r = await getJson(api);
    if (!r?.tag_name) continue;
    const assets: ReleaseAsset[] = [];
    for (const [platform, suffix] of Object.entries(app.releases!.assets)) {
      const a = (r.assets ?? []).find((x: any) => String(x.name).endsWith(suffix));
      if (a) assets.push({ platform, name: a.name, url: a.browser_download_url, size: a.size ?? 0 });
    }
    return {
      version: String(r.tag_name).replace(/^v/, ''),
      tag: r.tag_name,
      date: r.published_at ?? r.created_at ?? '',
      pageUrl: r.html_url ?? list,
      listUrl: list,
      source: source.type,
      assets,
    };
  }
  return null;
}

/** Where to send people when no release could be read at build time. */
export function releasesPage(app: App): string | null {
  const first = app.releases?.sources[0];
  return first ? apiUrl(first).list : null;
}

export interface ChangelogEntry {
  version: string;
  summary: string;
  groups: { title: string; items: string[] }[];
}

/**
 * Reads a CHANGELOG.md written as "## <version>", an optional summary
 * paragraph, then "### Added / Changed / Fixed" bullet lists. "Unreleased" is
 * skipped.
 */
export async function changelog(app: App): Promise<ChangelogEntry[]> {
  if (!app.changelog) return [];
  let text: string;
  try {
    const res = await fetch(app.changelog.url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return [];
    text = await res.text();
  } catch {
    return [];
  }
  const entries: ChangelogEntry[] = [];
  let cur: ChangelogEntry | null = null;
  let group: ChangelogEntry['groups'][number] | null = null;
  for (const line of text.split('\n')) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const li = line.match(/^[-*]\s+(.+)/);
    if (h2) {
      const v = h2[1].trim();
      cur = /unreleased/i.test(v) ? null : { version: v, summary: '', groups: [] };
      if (cur) entries.push(cur);
      group = null;
    } else if (!cur) {
      continue;
    } else if (h3) {
      group = { title: h3[1].trim(), items: [] };
      cur.groups.push(group);
    } else if (li && group) {
      group.items.push(li[1].trim());
    } else if (!group && line.trim()) {
      cur.summary += (cur.summary ? ' ' : '') + line.trim();
    }
  }
  for (const e of entries) e.groups = e.groups.filter((g) => g.items.length);
  return entries.slice(0, app.changelog.show ?? 3);
}

export function formatSize(bytes: number): string {
  if (!bytes) return '';
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}
