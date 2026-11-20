import { randomUUID } from 'node:crypto';
import { avatars, decide, play, startGame, tableView, tick } from './engine.mjs';

const roomKey = 'kronix:copacabana:room:principal:v1';
const lease = 120_000;
const memory = globalThis[Symbol.for(roomKey)] ??= { value: null };
const defaultSettings = { seats: 4, goal: 10, seconds: 10, jokers: true };
const redisUrl = process.env.COPACABANA_REDIS_URL ?? process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.COPACABANA_REDIS_TOKEN ?? process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const compareAndSet = [
  "local value = redis.call('GET', KEYS[1]) or ''",
  "if value ~= ARGV[1] then return 0 end",
  "redis.call('SET', KEYS[1], ARGV[2], 'EX', 7200)",
  "return 1",
].join('\n');

async function redis(command) {
  const response = await fetch(redisUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + redisToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Error de almacenamiento');
  const data = await response.json();
  if (data.error) throw new Error('Error de almacenamiento');
  return data.result;
}

function snapshot(room, token, now) {
  const seat = room.players.findIndex((player) => player.token === token);
  return {
    seat,
    host: seat === 0,
    players: room.players.map(({ name, avatar }) => ({ name, avatar })),
    settings: room.settings,
    match: room.match,
    game: tableView(room.game, seat),
    now,
    avatars,
  };
}

function fail(message, status = 400) {
  return { error: message, status };
}

function apply(room, token, action, now) {
  if (room.game && room.players.every((player) => now - player.seen >= 5 * lease)) {
    room.game = null;
    room.match = null;
    room.settings = { ...defaultSettings };
  }
  if (!room.game) room.players = room.players.filter((player) => now - player.seen < lease);
  const seat = room.players.findIndex((player) => player.token === token);
  if (seat >= 0 && now - room.players[seat].seen >= 20_000) room.players[seat].seen = now;
  tick(room.game, now);
  if (!action) return null;
  if (action.type === 'join') {
    if (room.game) return fail('La partida ya comenzó. Puedes ver la mesa y esperar la siguiente.', 409);
    if (seat < 0 && room.players.length >= room.settings.seats) return fail('La sala está llena.', 409);
    const name = typeof action.name === 'string' ? action.name.trim() : '';
    if (!name || name.length > 20 || !avatars.includes(action.avatar)) return fail('Elige un nombre de hasta 20 caracteres y un avatar.');
    const profile = { token, name, avatar: action.avatar, seen: now };
    if (seat < 0) room.players.push(profile);
    else room.players[seat] = profile;
    return null;
  }
  if (seat < 0) return fail('Únete a la sala para jugar.', 403);
  if (action.type === 'leave' && !room.game) {
    room.players.splice(seat, 1);
    if (!room.players.length) room.settings = { ...defaultSettings };
    return null;
  }
  if (action.type === 'reset' && room.game && room.game.winner !== null) {
    if (seat !== 0 && now - room.players[0].seen < lease) return fail('El anfitrión puede volver a la sala.', 403);
    room.game = null;
    room.match = null;
    return null;
  }
  if (!room.game && (action.type === 'settings' || action.type === 'start')) {
    if (seat !== 0) return fail('Solo el anfitrión puede configurar la partida.', 403);
    const { seats, goal, seconds, jokers } = action;
    if (![2, 3, 4].includes(seats) || seats < room.players.length
      || !Number.isInteger(goal) || goal < 1 || goal > Math.floor(104 / seats) - 10
      || !Number.isInteger(seconds) || seconds < 5 || seconds > 15 || typeof jokers !== 'boolean') {
      return fail('Revisa los asientos, las cartas objetivo y el reloj.');
    }
    room.settings = { seats, goal, seconds, jokers };
    if (action.type === 'start') {
      const players = room.players.slice();
      const botNames = ['Mar', 'Sol', 'Río'];
      const available = avatars.filter((avatar) => !players.some((player) => player.avatar === avatar));
      while (players.length < seats) players.push({ name: botNames.shift(), avatar: available.shift(), bot: true });
      room.game = startGame(players, room.settings, now);
      room.match = randomUUID();
    }
    return null;
  }
  if (!room.game || room.match !== action.match || room.game.version !== action.version) {
    return fail('La mesa cambió. Intenta el movimiento de nuevo.', 409);
  }
  if (action.type === 'draw' && room.game.prompt?.seat === seat && typeof action.accept === 'boolean') {
    decide(room.game, action.accept, now);
    return null;
  }
  if (action.type === 'move' && seat === room.game.turn && play(room.game, action, now)) return null;
  return fail('Ese movimiento no está disponible.', 409);
}

export async function transact(token, action) {
  const shared = Boolean(redisUrl && redisToken);
  if (!shared && process.env.VERCEL) {
    return fail('La sala en línea está en preparación.', 503);
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const raw = shared ? await redis(['GET', roomKey]) : memory.value;
    const now = Date.now();
    const room = raw ? JSON.parse(raw) : { players: [], settings: { ...defaultSettings }, game: null, match: null };
    const before = JSON.stringify(room);
    const error = apply(room, token, action, now);
    const after = JSON.stringify(room);
    if (before !== after) {
      if (shared) {
        if (!await redis(['EVAL', compareAndSet, 1, roomKey, raw ?? '', after])) continue;
      } else {
        memory.value = after;
      }
    }
    return { ...snapshot(room, token, now), ...error };
  }
  return fail('La mesa está ocupada. Intenta de nuevo.', 503);
}
