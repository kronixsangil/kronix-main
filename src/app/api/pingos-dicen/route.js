import {createHash, randomUUID} from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const ttl = 86400;
const namespace = 'kronix:pingos-dicen:v1:';
const memory = globalThis[Symbol.for(namespace)] ??= new Map();
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const redisUrl = process.env.COPACABANA_REDIS_URL ?? process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.COPACABANA_REDIS_TOKEN ?? process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const keyFrom = secret => createHash('sha256').update(secret).digest('hex').slice(0,32)
  .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
const headers = {'Cache-Control':'no-store'};
const reply = (body, status = 200) => Response.json(body, {headers,status});
async function command(room, teams) {
  const key = namespace + room;
  if (!redisUrl || !redisToken) {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) throw new Error('Redis required');
    const now = Date.now();
    if (teams) {
      for (const [id, item] of memory) if (item.expires <= now) memory.delete(id);
      if (memory.size >= 500 && !memory.has(key)) throw new Error('Capacity');
      memory.set(key, {teams, expires:now + ttl * 1000});
      return;
    }
    const item = memory.get(key);
    return item?.expires > now ? item.teams : null;
  }
  const response = await fetch(redisUrl, {
    method:'POST', headers:{Authorization:'Bearer ' + redisToken,'Content-Type':'application/json'},
    body:JSON.stringify(teams ? ['SET',key,JSON.stringify(teams),'EX',ttl] : ['GET',key]),
    cache:'no-store', signal:AbortSignal.timeout(4500),
  });
  if (!response.ok) throw new Error('Redis request failed');
  const result = await response.json();
  if (result.error) throw new Error('Redis operation failed');
  return teams ? undefined : JSON.parse(result.result ?? 'null');
}
export async function GET(request) {
  const query = new URL(request.url).searchParams;
  const room = query.get('room');
  const team = query.get('team');
  if (!uuid.test(room ?? '') || !/^[0-7]$/.test(team ?? '')) return reply({error:'Marcador inválido.'},400);
  if (query.get('manifest') === '1') {
    const start = '/pingos-dicen/score.html?' + new URLSearchParams({room,team});
    return Response.json({
      id:start,name:'Pingos Dicen · Equipo ' + (Number(team) + 1),short_name:'Pingos ' + (Number(team) + 1),
      start_url:start,scope:'/pingos-dicen/',display:'standalone',lang:'es',
      background_color:'#10201e',theme_color:'#10201e',
      icons:[192,512].map(size => ({src:'/pingos-dicen/icon-' + size + '.png',sizes:size + 'x' + size,type:'image/png'})),
    }, {headers:{...headers,'Content-Type':'application/manifest+json'}});
  }
  try {
    const teams = await command(room);
    return teams ? reply(teams[Number(team)]) : reply({error:'Marcador pendiente.'},404);
  } catch { return reply({error:'Marcador no disponible.'},503); }
}
export async function POST(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json') ||
    request.headers.get('sec-fetch-site') === 'cross-site') return reply({error:'Solicitud inválida.'},415);
  let secret, teams;
  try {
    const body = await request.text();
    if (body.length > 4096) throw new Error();
    ({secret,teams} = JSON.parse(body));
    if (secret !== null && !uuid.test(secret ?? '')) throw new Error();
    if (!Array.isArray(teams) || teams.length !== 8 || teams.some(team =>
      typeof team?.name !== 'string' || !team.name.trim() || team.name.length > 28 ||
      !Number.isInteger(team.points) || team.points < 0 || team.points > 800)) throw new Error();
    teams = teams.map(({name,points}) => ({name,points}));
  } catch { return reply({error:'Datos inválidos.'},400); }
  try {
    secret ??= randomUUID();
    const room = keyFrom(secret);
    await command(room,teams);
    return reply({room,secret});
  } catch { return reply({error:'No se pudo sincronizar el marcador.'},503); }
}
