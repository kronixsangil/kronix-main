import { randomUUID } from 'node:crypto';
import { transact } from './room.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handle(request, action) {
  let token = request.headers.get('cookie')?.match(/(?:^|;\s*)copacabana=([\da-f-]{36})(?:;|$)/)?.[1];
  const fresh = !token;
  if (fresh) token = randomUUID();
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (fresh) {
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    headers.set('Set-Cookie', 'copacabana=' + token + '; Path=/api/copacabana; HttpOnly; SameSite=Strict; Max-Age=86400' + secure);
  }
  try {
    const result = await transact(token, action);
    return Response.json(result, { headers, status: result.status ?? 200 });
  } catch (error) {
    console.error('Copacabana', error.name);
    return Response.json({ error: 'La sala no está disponible. Intenta en un momento.' }, { status: 503, headers });
  }
}

export function GET(request) {
  return handle(request, null);
}

export async function POST(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')
    || request.headers.get('sec-fetch-site') === 'cross-site') {
    return Response.json({ error: 'Solicitud inválida.' }, { status: 415 });
  }
  try {
    const body = await request.text();
    const action = body.length <= 2048 ? JSON.parse(body) : null;
    if (!action || typeof action.type !== 'string') throw new Error();
    return handle(request, action);
  } catch {
    return Response.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }
}
