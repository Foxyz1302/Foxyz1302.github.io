// Loads the Markdown texts in src/content/<lang>/<name>.md.
// Missing Russian text falls back to the English file.
import type { Lang } from './data';

const files = import.meta.glob<{ Content: any; frontmatter: Record<string, any> }>('../content/*/*.md', { eager: true });

export function md(name: string, lang: Lang) {
  return files[`../content/${lang}/${name}.md`] ?? files[`../content/en/${name}.md`];
}
