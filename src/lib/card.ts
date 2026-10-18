// Builds the app developer-card feed (/card/v1.json) from data.json.
// The format is a public contract read by released apps: see
// docs/CARD-FEED.md before changing anything here. Adding fields is fine;
// renaming, removing or changing a field's type needs a new /card/v2.json.
import { data, LANGS, href, type Text, type Lang } from './data';

type L10n = Partial<Record<Lang, string>>;

const abs = (path: string) => new URL(path, data.site.url).href;
const l10n = (x: Text | undefined): L10n | undefined =>
  x == null ? undefined : typeof x === 'string' ? { en: x } : { ...x };
const perLang = (path: string): L10n => Object.fromEntries(LANGS.map((l) => [l, abs(href(path, l))]));

export function buildCard() {
  const c = data.commissions;
  const options = data.donations.options.filter((o) => !o.placeholder);
  const ids = new Set(options.map((o) => o.id));
  return {
    schema: 1,
    updated: new Date().toISOString(),
    refreshAfterHours: 24,
    developer: {
      name: data.person.name,
      role: l10n(data.person.role),
      pitch: l10n(data.person.pitch),
      avatar: abs('/avatar-256.png'),
      website: perLang('/'),
    },
    commissions: {
      status: c.status,
      slots: c.slotsPlaceholder ? null : c.slots ?? null,
      note: l10n(c.note),
      url: perLang('/commissions/'),
    },
    support: {
      url: perLang('/support/'),
      order: Object.fromEntries(LANGS.map((l) => [l, (data.donations.order[l] ?? []).filter((id) => ids.has(id))])),
      options: options.map((o) => ({
        id: o.id,
        kind: o.kind,
        name: l10n(o.name),
        note: l10n(o.note),
        ...(o.kind === 'link' ? { url: o.url } : { network: o.network, address: o.address }),
      })),
    },
    contact: data.contact
      .filter((x) => !x.placeholder)
      .map(({ id, label, value, url }) => ({ id, label, value, url })),
    apps: data.apps
      .filter((a) => !a.placeholder && a.status === 'released' && a.icon)
      .map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        pitch: l10n(a.pitch),
        icon: abs(a.icon!.replace(/\.svg$/, '.png')),
        platforms: a.platforms,
        url: perLang(`/apps/${a.id}/`),
        embed: abs(`/embed/${a.id}/`),
      })),
  };
}
