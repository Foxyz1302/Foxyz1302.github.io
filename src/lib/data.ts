// Typed access to public/data.json. The shape is documented in docs/DATA.md;
// these types are the same thing in code form.
import raw from '../../public/data.json';

export type Lang = 'en' | 'ru';
export const LANGS: Lang[] = ['en', 'ru'];

/** A text that is either the same in every language or given per language. */
export type Text = string | Partial<Record<Lang, string>>;

export type Platform = 'linux' | 'windows' | 'macos' | 'android' | 'ios' | 'web';

export interface Contact {
  id: string;
  label: string;
  value: string;
  url: string;
  placeholder?: boolean;
}

export interface Price {
  name: Text;
  from?: number;
  perHour?: number;
  placeholder?: boolean;
}

export interface Commissions {
  status: 'open' | 'limited' | 'closed';
  slots?: number;
  slotsPlaceholder?: boolean;
  note?: Text;
  currency: string;
  prices: Price[];
  /** id of the contact entry clients should use. */
  contact: string;
}

export interface DonationOption {
  id: string;
  kind: 'link' | 'crypto';
  name: Text;
  url?: string;
  network?: string;
  address?: string;
  note?: Text;
  preferred?: boolean;
  placeholder?: boolean;
}

export interface ReleaseSource {
  type: 'github' | 'gitea';
  repo: string;
  /** Gitea only: e.g. https://git.example.com */
  host?: string;
}

export interface Media {
  type: 'image' | 'video' | 'youtube';
  src: string;
  alt?: Text;
  placeholder?: boolean;
}

export interface App {
  id: string;
  name: string;
  /** Only 'released' apps get a page, a Download button, an embed and a place in the card feed. */
  status: 'released' | 'in-development' | 'coming';
  /** The name is not final: shown with a "working title" note. */
  workingTitle?: boolean;
  featured?: boolean;
  placeholder?: boolean;
  /** Square icon; without one the site draws generated placeholder art. */
  icon?: string;
  pitch: Text;
  description?: Text;
  platforms: Platform[];
  tags?: string[];
  features?: Partial<Record<Lang, string[]>>;
  requirements?: Text;
  media?: Media[];
  releases?: {
    sources: ReleaseSource[];
    /** platform key (e.g. linux-x64) -> end of the asset's file name */
    assets: Record<string, string>;
  };
  changelog?: { url: string; show?: number };
}

export interface SiteData {
  site: { url: string; title: string; description: Text; sourceRepo?: string };
  person: { name: string; role: Text; pitch: Text; languages?: Text; avatar: string };
  contact: Contact[];
  commissions: Commissions;
  donations: { order: Record<Lang, string[]>; options: DonationOption[] };
  apps: App[];
  resume: {
    summary: Text;
    skills: { group: Text; items: string[] }[];
    timeline: { when: string; what: Text; detail?: Text; placeholder?: boolean }[];
  };
}

export const data = raw as unknown as SiteData;

/** Picks the text for a language, falling back to English. */
export function t(text: Text | undefined, lang: Lang): string {
  if (text == null) return '';
  if (typeof text === 'string') return text;
  return text[lang] ?? text.en ?? Object.values(text)[0] ?? '';
}

/** Donation options in the order set for this language (unlisted ones are hidden). */
export function donationsFor(lang: Lang): DonationOption[] {
  const byId = new Map(data.donations.options.map((o) => [o.id, o]));
  return (data.donations.order[lang] ?? data.donations.order.en)
    .map((id) => byId.get(id))
    .filter((o): o is DonationOption => !!o);
}

export const isReleased = (a: App) => a.status === 'released';
export const appById = (id: string) => data.apps.find((a) => a.id === id);
export const contactById = (id: string) => data.contact.find((c) => c.id === id);

/** Path inside the site for a language: '/apps/' -> '/ru/apps/'. */
export function href(path: string, lang: Lang): string {
  return lang === 'en' ? path : `/${lang}${path}`;
}

export const PLATFORM_LABEL: Record<string, string> = {
  linux: 'Linux',
  windows: 'Windows',
  macos: 'macOS',
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
  'linux-x64': 'Linux',
  'windows-x64': 'Windows',
  'macos-arm64': 'macOS',
  'android-apk': 'Android',
};
