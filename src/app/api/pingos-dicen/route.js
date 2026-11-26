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
const cas = [
  "if (redis.call('GET', KEYS[1]) or '') ~= ARGV[1] then return 0 end",
  "redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])",
  "return 1",
].join('\n');
async function redis(args) {
  const response = await fetch(redisUrl, {
    method:'POST', headers:{Authorization:'Bearer ' + redisToken,'Content-Type':'application/json'},
    body:JSON.stringify(args),
    cache:'no-store', signal:AbortSignal.timeout(4500),
  });
  if (!response.ok) throw new Error('Redis request failed');
  const result = await response.json();
  if (result.error) throw new Error('Redis operation failed');
  return result.result;
}
function decode(raw) {
  if (!raw) return null;
  const data = JSON.parse(raw);
  return Array.isArray(data) ? {teams:data, buzzer:null} : data;
}
async function command(room, mutate) {
  const key = namespace + room;
  if (!redisUrl || !redisToken) {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) throw new Error('Redis required');
    const now = Date.now();
    const item = memory.get(key);
    const current = decode(item?.expires > now ? item.raw : null);
    if (!mutate) return current;
    const next = mutate(current);
    if (!next) return current;
    for (const [id, record] of memory) if (record.expires <= now) memory.delete(id);
    if (memory.size >= 500 && !memory.has(key)) throw new Error('Capacity');
    memory.set(key, {raw:JSON.stringify(next), expires:now + ttl * 1000});
    return next;
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const raw = await redis(['GET',key]) ?? '';
    const current = decode(raw);
    if (!mutate) return current;
    const next = mutate(current);
    if (!next) return current;
    if (await redis(['EVAL',cas,1,key,raw,JSON.stringify(next),ttl])) return next;
  }
  throw new Error('Scoreboard busy');
}
function teamView(state, team) {
  const buzzer = state.buzzer;
  return {
    ...state.teams[team],
    ...(buzzer?.teams.includes(team) ? {buzzer:{
      id:buzzer.id, mode:buzzer.mode, winner:buzzer.winner,
      second:buzzer.second ?? null,
      winnerName:buzzer.winner === null ? '' : state.teams[buzzer.winner].name,
    }} : {}),
  };
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
    const state = await command(room);
    return state ? reply(teamView(state, Number(team))) : reply({error:'Marcador pendiente.'},404);
  } catch { return reply({error:'Marcador no disponible.'},503); }
}
export async function POST(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json') ||
    request.headers.get('sec-fetch-site') === 'cross-site') return reply({error:'Solicitud inválida.'},415);
  let input;
  try {
    const body = await request.text();
    if (body.length > 4096) throw new Error();
    input = JSON.parse(body);
    if (!input || typeof input !== 'object') throw new Error();
  } catch { return reply({error:'Datos inválidos.'},400); }

  if (input.type === 'buzz') {
    const {room,team,id} = input;
    if (!uuid.test(room ?? '') || !uuid.test(id ?? '') || !Number.isInteger(team) || team < 0 || team > 7) {
      return reply({error:'Pulsación inválida.'},400);
    }
    try {
      const state = await command(room, current => {
        const buzzer = current?.buzzer;
        if (!buzzer || buzzer.id !== id || buzzer.mode !== 'armed' || !buzzer.teams.includes(team) ||
            buzzer.winner === team || buzzer.second != null) return null;
        const entry = buzzer.winner === null ? {winner:team} : {second:team};
        return {...current, buzzer:{...buzzer, ...entry}};
      });
      return state ? reply(teamView(state,team)) : reply({error:'Marcador pendiente.'},404);
    } catch { return reply({error:'Pulsador no disponible.'},503); }
  }

  let {secret,teams,buzzer} = input;
  if (secret !== null && !uuid.test(secret ?? '')) return reply({error:'Datos inválidos.'},400);
  if (!Array.isArray(teams) || teams.length !== 8 || teams.some(team =>
      typeof team?.name !== 'string' || !team.name.trim() || team.name.length > 28 ||
      !Number.isInteger(team.points) || team.points < 0 || team.points > 800)) return reply({error:'Datos inválidos.'},400);
  if (buzzer != null) {
    if (!uuid.test(buzzer.id ?? '') || !['ready','armed'].includes(buzzer.mode) ||
      !Array.isArray(buzzer.teams) || buzzer.teams.length !== 2 || new Set(buzzer.teams).size !== 2 ||
      buzzer.teams.some(team => !Number.isInteger(team) || team < 0 || team > 7)) return reply({error:'Pulsador inválido.'},400);
    buzzer = {id:buzzer.id, mode:buzzer.mode, teams:buzzer.teams, winner:null, second:null};
  }
  try {
    secret ??= randomUUID();
    const room = keyFrom(secret);
    teams = teams.map(({name,points}) => ({name,points}));
    const state = await command(room, previous => ({
      teams,
      buzzer:buzzer && previous?.buzzer?.id === buzzer.id && previous.buzzer.winner !== null
        ? {...buzzer, winner:previous.buzzer.winner, second:previous.buzzer.second ?? null} : buzzer ?? null,
    }));
    return reply({room,secret,winner:state.buzzer?.winner ?? null});
  } catch { return reply({error:'No se pudo sincronizar el marcador.'},503); }
}
