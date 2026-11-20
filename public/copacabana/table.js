const content = document.querySelector('#content');
const message = document.querySelector('#message');
const connection = document.querySelector('#connection');
const ranks = ['★', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
let state;
let signature;
let selected;
let avatar;
let nameDraft = '';
let settingsDraft;
let inFlight = false;
let requestDone = Promise.resolve();
let clockOffset = 0;
let failures = 0;

const themeKey = 'kronix-bingo-theme';
const themeColors = { default: '#101316', neon: '#071321', kronix: '#f3f8fd', fiesta: '#211235', crema: '#f7f0e3', party: '#fff4ce' };
const themePicker = document.querySelector('#theme');
function applyTheme(value) {
  const theme = Object.hasOwn(themeColors, value) ? value : 'default';
  themePicker.value = theme;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = themeColors[theme];
}
try { applyTheme(localStorage.getItem(themeKey)); } catch { applyTheme('default'); }
themePicker.addEventListener('change', () => {
  applyTheme(themePicker.value);
  try { localStorage.setItem(themeKey, themePicker.value); } catch { /* The current theme still applies. */ }
});
window.addEventListener('storage', (event) => {
  if (event.key === themeKey || event.key === null) applyTheme(event.newValue);
});

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function say(text) {
  message.textContent = text;
}

async function request(action) {
  if (inFlight && !action) return false;
  while (inFlight) await requestDone;
  inFlight = true;
  let release;
  requestDone = new Promise((resolve) => { release = resolve; });
  try {
    const response = await fetch('/api/copacabana', action ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action),
      signal: AbortSignal.timeout(8000),
    } : { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const next = await response.json();
    if (!response.ok && !next.settings) throw new Error(next.error);
    if (next.settings) {
      const { now, status, error, ...visible } = next;
      clockOffset = now - Date.now();
      const key = JSON.stringify(visible);
      if (key !== signature || action) {
        if (next.game?.version !== state?.game?.version || next.match !== state?.match) selected = null;
        if (next.host !== state?.host || next.match !== state?.match) settingsDraft = null;
        state = visible;
        avatar ??= visible.avatars[0];
        signature = key;
        render();
      }
    }
    if (action) say(next.error ?? '');
    else if (failures) say('');
    failures = 0;
    connection.textContent = 'Sala de prueba · En línea';
    return response.ok;
  } catch (error) {
    failures++;
    connection.textContent = 'Reconectando…';
    if (action || failures === 2) say(error.message === 'Failed to fetch' ? 'Se perdió la conexión con la sala.' : error.message);
    return false;
  } finally {
    inFlight = false;
    release();
    updateClock();
  }
}

function render() {
  const focus = document.activeElement?.dataset.focus;
  const selection = focus === 'name' ? document.activeElement.selectionStart : null;
  content.innerHTML = state.game ? table() : lobby();
  if (focus) {
    const target = [...content.querySelectorAll('[data-focus]')].find((element) => element.dataset.focus === focus);
    target?.focus({ preventScroll: true });
    if (target && selection !== null) target.setSelectionRange(selection, selection);
  }
  updateClock();
}

function lobby() {
  const me = state.players[state.seat];
  const options = settingsDraft ?? state.settings;
  const capacity = options.seats;
  const maxGoal = Math.floor(104 / Number(capacity)) - 10;
  return `<div class="lobby">
    <section class="panel roster"><h2>Sala de prueba</h2>
      <p>Invita a tus amigos. Los bots toman los asientos libres al iniciar.</p>
      <ul class="seat-list">${Array.from({ length: capacity }, (_, index) => {
        const player = state.players[index];
        return `<li><span class="avatar">${player?.avatar ?? '✧'}</span><div><strong>${escape(player?.name ?? 'Asiento libre')}</strong><small>${player ? (index === 0 ? 'Anfitrión' : 'En la sala') : 'Invitado o bot'}</small></div></li>`;
      }).join('')}</ul>
    </section>
    <section class="panel">
      ${!me ? `<form id="join"><h2>Elige tu avatar</h2>
        <div class="avatars" role="group" aria-label="Avatares">${state.avatars.map((icon, index) => `<button type="button" class="avatar" data-avatar="${icon}" data-focus="avatar-${index}" aria-label="${['Guacamaya','Jaguar','Zorro','Pulpo','Búho','Rana','Mariposa','Tortuga','Flamenco','Mono','Delfín','Cangrejo'][index]}" aria-pressed="${icon === avatar}">${icon}</button>`).join('')}</div>
        <label>Tu nombre<input name="name" data-focus="name" maxlength="20" required value="${escape(nameDraft)}" autocomplete="nickname"></label>
        <button class="primary" type="submit">Entrar a la sala</button></form>`
        : state.host ? `<form id="settings"><h2>Configura la partida</h2>
        <div class="fields">
          <label>Asientos<select name="seats" data-focus="seats">${[2, 3, 4].filter((n) => n >= state.players.length).map((n) => `<option value="${n}" ${Number(capacity) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label>Cartas objetivo<input name="goal" data-focus="goal" required type="number" min="1" max="${maxGoal}" value="${options.goal}"></label>
          <label>Segundos por movimiento<input name="seconds" data-focus="seconds" required type="number" min="5" max="15" value="${options.seconds}"></label>
        </div>
        <label class="check"><input name="jokers" type="checkbox" ${options.jokers ? 'checked' : ''}> Jugar con comodines</label>
        <div class="actions"><button class="primary" type="submit">Empezar partida</button><button class="outline" type="button" data-action="leave">Salir</button></div></form>`
        : `<h2>Todo listo, ${escape(me.name)}</h2><p>El anfitrión puede empezar cuando estén listos.</p><button class="outline" data-action="leave">Salir de la sala</button>`}
    </section>
  </div>`;
}

function face(card, effective) {
  if (!card) return '<span class="empty-symbol" aria-hidden="true">＋</span>';
  const joker = card.rank === 0;
  const red = /[♥♦]/.test(card.suit);
  return `<span class="face ${red ? 'red' : ''} ${joker ? 'joker' : ''}"><span class="corner">${ranks[card.rank]}</span><span class="pip">${card.suit ?? (effective ? ranks[effective] : '✦')}</span></span>`;
}

function description(card, effective) {
  if (!card) return 'vacío';
  if (!card.rank) return effective ? 'comodín como ' + ranks[effective] : 'comodín';
  return ranks[card.rank] + ' ' + card.suit;
}

function tile(kind, index, card, options = {}) {
  const { count, viewOnly, effective, caption, label } = options;
  const source = !viewOnly && state.game.moves.some((move) => move.from === kind && move.index === index);
  const destination = !viewOnly && selected && state.game.moves.some((move) =>
    move.from === selected.kind && move.index === selected.index && move.target === kind && move.to === index);
  const active = source && selected?.kind === kind && selected.index === index;
  const attrs = source || destination
    ? `button type="button" data-card="${kind}" data-index="${index}" data-focus="${kind}-${index}" aria-label="${escape(label + ', ' + description(card, effective))}" aria-pressed="${Boolean(active)}"`
    : `div role="img" aria-label="${escape(label + ', ' + description(card, effective) + (count ? ', ' + count + ' cartas' : ''))}"`;
  const tag = source || destination ? 'button' : 'div';
  return `<div class="card-unit"><${attrs} class="tile ${kind} ${destination ? 'destination' : ''} ${active ? 'selected' : ''} ${card ? 'has-card' : ''}">
    ${face(card, effective)}${count ? `<span class="count">${count}</span>` : ''}</${tag}>${caption ? `<small>${caption}</small>` : ''}</div>`;
}

function seatPanel(player, index) {
  const game = state.game;
  const mine = index === state.seat;
  return `<section class="seat ${mine ? 'mine' : ''} ${index === game.turn ? 'active-seat' : ''}" aria-label="${escape(player.name)}">
    <div class="player-heading"><span class="avatar">${player.avatar}</span><div><strong>${escape(player.name)}</strong><small>${mine ? 'Tú' : player.bot ? 'Bot' : 'Jugador'} · ${player.handCount} en mano</small></div></div>
    <div class="cards">${player.slots.map(({ card, count }, slot) => tile('slot', slot, card, {
      count, viewOnly: !mine, label: 'Espacio propio ' + (slot + 1),
    })).join('')}${tile('goal', 0, player.goal.card, { count: player.goal.count, viewOnly: !mine, label: 'Montón objetivo', caption: 'Objetivo' })}</div>
  </section>`;
}

function table() {
  const game = state.game;
  const mine = game.players[state.seat];
  const opponents = game.players.map((player, index) => index === state.seat ? '' : seatPanel(player, index)).join('');
  const current = game.players[game.turn];
  const title = game.winner === -1 ? 'Empate' : game.winner !== null ? 'Ganó ' + game.players[game.winner].name
    : game.prompt ? 'Propuesta de empate' : state.seat === game.turn ? 'Tu turno' : 'Turno de ' + current.name;
  const canReset = game.winner !== null && state.seat >= 0;
  return `<section class="table ${game.grace ? 'grace' : ''}">
    <div class="table-toolbar"><div><p class="overline">RONDA ${game.rounds + 1}</p><h2>${escape(title)}</h2></div>
      ${game.winner === null ? '<div class="clock"><strong id="seconds"></strong><span>segundos</span></div>' : ''}</div>
    <p class="notice">${escape(game.notice)}</p>
    ${game.prompt?.seat === state.seat ? '<div class="actions"><button class="primary" data-action="accept">Aceptar empate</button><button class="outline" data-action="continue">Seguir jugando</button></div>'
      : game.prompt ? `<p>${escape(game.players[game.prompt.seat].name)} está decidiendo si continuar.</p>` : ''}
    <div class="opponents">${opponents}</div>
    <section class="common" aria-label="Espacios comunes">
      <div class="card-unit"><div class="tile stock"><span aria-hidden="true">✦</span><span class="count">${game.stock}</span></div><small>Robo</small></div>
      ${game.center.map(({ card, rank }, index) => tile('center', index, card, { effective: rank, label: 'Espacio común ' + (index + 1), caption: rank ? ranks[rank] : 'A / ★' })).join('')}
      <div class="completed"><strong>${game.completed}</strong><small>Completadas</small></div>
    </section>
    ${mine ? seatPanel(mine, state.seat) : '<p class="notice">Estás viendo la partida como visitante.</p>'}
    ${mine ? `<section class="hand"><div><h3>Tu mano</h3><p>${selected ? 'Elige un destino iluminado.'
      : game.winner !== null ? 'Partida terminada.'
        : game.prompt ? 'La mesa está en pausa.'
          : state.seat !== game.turn ? 'Espera tu turno.'
            : game.grace ? 'Llena tus espacios y remonta.'
              : 'Selecciona una carta que puedas jugar.'}</p></div><div class="cards">${mine.hand.map((card, index) => tile('hand', index, card, { label: 'Tu mano' })).join('')}</div></section>` : ''}
    ${canReset ? '<button class="primary" data-action="reset">Volver a la sala</button>' : ''}
  </section>`;
}

function updateClock() {
  const element = document.querySelector('#seconds');
  if (!element || !state?.game) return;
  const game = state.game;
  const remaining = Math.max(0, Math.ceil(((game.prompt?.deadline ?? game.deadline) - clockOffset - Date.now()) / 1000));
  element.textContent = remaining;
}

function readSettings(form) {
  const data = new FormData(form);
  return {
    seats: Number(data.get('seats')), goal: Number(data.get('goal')), seconds: Number(data.get('seconds')),
    jokers: data.has('jokers'),
  };
}

content.addEventListener('input', ({ target }) => {
  if (target.name === 'name') nameDraft = target.value;
  if (target.form?.id === 'settings') {
    settingsDraft = readSettings(target.form);
    if (target.name === 'seats') {
      settingsDraft.goal = Math.min(settingsDraft.goal, Math.floor(104 / settingsDraft.seats) - 10);
      render();
    }
  }
});

content.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === 'join') await request({ type: 'join', name: nameDraft, avatar });
  if (form.id === 'settings') await request({ type: 'start', ...readSettings(form) });
});

content.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button || !state) return;
  const data = button.dataset;
  if (data.avatar) {
    avatar = data.avatar;
    render();
  }
  if (data.action) {
    const type = data.action;
    if (type === 'leave' || type === 'reset') await request({ type });
    else await request({ type: 'draw', accept: type === 'accept', match: state.match, version: state.game.version });
  }
  if (!data.card) return;
  const kind = data.card;
  const index = Number(data.index);
  const move = selected && state.game.moves.find(({ from, index: cardIndex, target, to }) =>
    from === selected.kind && cardIndex === selected.index && target === kind && to === index);
  if (move) {
    await request({ type: 'move', match: state.match, version: state.game.version, ...move });
    return;
  }
  selected = selected?.kind === kind && selected.index === index ? null : { kind, index };
  render();
});

document.querySelector('#invite').addEventListener('click', async () => {
  const url = new URL('/copacabana', location.origin).href;
  try {
    await navigator.clipboard.writeText(url);
    say('Invitación copiada.');
  } catch {
    say(url);
  }
});

request();
setInterval(() => request(), 900);
setInterval(updateClock, 150);
