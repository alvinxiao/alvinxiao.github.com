import { z } from 'astro/zod';

const authoredOrder = ['ai-basics', 'getting-started', 'workflow'];
const journeySchema = z
  .array(z.string().min(1))
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, 'Resource journey IDs must be unique');

export function resolveResourceJourney<T extends { id: string }>(
  articles: readonly T[],
  order: unknown = authoredOrder,
): T[] {
  const ids = journeySchema.parse(order);
  const byId = new Map(articles.map((article) => [article.id, article]));
  if (byId.size !== articles.length) throw new Error('Resource article IDs must be unique');
  const ordered = ids.map((id) => {
    const article = byId.get(id);
    if (!article) throw new Error(`Resource journey references missing guide: ${id}`);
    return article;
  });
  const omitted = articles.filter((article) => !ids.includes(article.id));
  if (omitted.length)
    throw new Error(
      `Resource journey omits guides: ${omitted.map((article) => article.id).join(', ')}`,
    );
  return ordered;
}
