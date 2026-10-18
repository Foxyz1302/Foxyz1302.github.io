// Served as /card/v1.json: the feed the in-app developer card reads.
import { buildCard } from '../../lib/card';

export function GET() {
  return new Response(JSON.stringify(buildCard(), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
