import {phases, newState, questionFor, pointsFor, winnerFor, projection, teamScores} from './game.mjs';
import {sound, unlockSound, setVolume} from './sound.mjs';

const $ = id => document.getElementById(id);
const storageKey = 'kronix.pingos-dicen.v1';
let state = newState();
try { state = JSON.parse(sessionStorage.getItem(storageKey)) || state; } catch {}
let volume = 85;
try { volume = Number(localStorage.getItem(storageKey + '.volume') ?? 85); } catch {}
if (!Number.isFinite(volume) || volume < 0 || volume > 100) volume = 85;
function updateVolume() {
  $('volume').value = volume;
  $('volume-value').textContent = volume + ' %';
  $('test-sound').disabled = state.mute || volume === 0;
  setVolume(volume / 100);
}
updateVolume();
$('volume').oninput = event => {
  volume = Number(event.target.value);
  updateVolume();
  try {localStorage.setItem(storageKey + '.volume', String(volume));} catch {}
};
$('test-sound').onclick = () => {
  if (!state.mute) sound('hit');
};
let screen;
let room;
let syncTimer;
let syncing = false;
let pending = false;
try {room = JSON.parse(sessionStorage.getItem(storageKey + '.room'));} catch {}
const history = [];
const allRounds = ['1 · ×1', '2 · ×1', '3 · ×2', '4 · ×3', 'Reserva · ×1'];
const active = () => state.games[state.match];
const roundState = () => active().rounds[active().round];
function publish(effect = '') {
  if (screen && !screen.closed) screen.postMessage({type:'pingos-board', board:projection(state), effect}, location.origin);
}
function change(operation, effect = '') {
  history.push(structuredClone(state));
  operation();
  saveAndRender(effect);
}
function saveAndRender(effect = '') {
  try {sessionStorage.setItem(storageKey, JSON.stringify(state));} catch {}
  render();
  publish(effect);
  if (effect && !state.mute) sound(effect);
  if (room) scheduleScores();
}
function scheduleScores(delay = 150) {
  pending = true;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncScores, delay);
}
async function syncScores() {
  if (syncing || !pending) return;
  pending = false;
  syncing = true;
  let retry = 150;
  $('enable-scores').disabled = true;
  try {
    const response = await fetch('/api/pingos-dicen', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:room?.secret ?? null, teams:teamScores(state)}),
      signal:AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error();
    room = await response.json();
    try {sessionStorage.setItem(storageKey + '.room', JSON.stringify(room));} catch {}
    $('sync-status').textContent = 'Marcadores sincronizados.';
    renderTeamLinks();
  } catch {
    $('sync-status').textContent = room ? 'Sin conexión con los marcadores. Reintentando…' : 'No se pudieron activar los marcadores. Intenta de nuevo.';
    if (room) { pending = true; retry = 3000; }
  } finally {
    syncing = false;
    $('enable-scores').disabled = false;
    if (pending) scheduleScores(retry);
  }
}
function renderTeamLinks() {
  $('enable-scores').hidden = true;
  $('team-links').replaceChildren(...teamScores(state).map(({name}, team) => {
    const button = document.createElement('button');
    button.textContent = 'Copiar enlace · ' + name;
    button.onclick = async () => {
      const url = new URL('./score.html', location.href);
      url.search = new URLSearchParams({room:room.room, team});
      try {
        await navigator.clipboard.writeText(url.href);
        $('sync-status').textContent = 'Enlace copiado para ' + name + '.';
      } catch { window.prompt('Copia el enlace del equipo', url.href); }
    };
    return button;
  }));
}
$('enable-scores').onclick = () => scheduleScores(0);
function selectOptions(select, labels) {
  labels.forEach((label, index) => select.add(new Option(label, index)));
}
selectOptions($('match'), phases.map((phase, i) => 'Juego ' + (i + 1) + ' · ' + phase));
selectOptions($('round'), allRounds);
function render() {
  const game = active();
  const played = roundState();
  const board = projection(state);
  const {question, answers} = questionFor(state.match, game.round);
  const winner = winnerFor(game);
  $('match').value = state.match;
  $('round').value = game.round;
  const regularComplete = game.rounds.slice(0, 4).every(round => round.award);
  $('round').options[4].disabled = !regularComplete || (winner !== null && !game.rounds[4].award);
  $('left').value = game.names[0];
  $('right').value = game.names[1];
  $('left').placeholder = board.names[0];
  $('right').placeholder = board.names[1];
  $('mute').checked = state.mute;
  $('test-sound').disabled = state.mute || volume === 0;
  $('question').textContent = question;
  $('question-toggle').textContent = played.show ? 'Ocultar pregunta' : 'Mostrar pregunta';
  $('answers').replaceChildren(...answers.map(([answer, votes], i) => {
    const button = document.createElement('button');
    const shown = played.reveal.includes(i);
    button.className = shown ? 'revealed' : '';
    button.disabled = shown;
    button.textContent = (i + 1) + ' · ' + answer + ' · ' + votes + ' votos' + (shown ? ' ✓' : '');
    button.onclick = () => change(() => played.reveal.push(i), 'hit');
    return button;
  }));
  $('pool').textContent = board.pool;
  $('errors').textContent = played.strikes + ' / 3';
  $('score').textContent = board.scores.join(' – ');
  $('strike').disabled = played.strikes >= 3 || !!played.award;
  $('clear').disabled = played.strikes === 0;
  $('undo').disabled = history.length === 0;
  ['left','right'].forEach((side, i) => {
    const button = $('award-' + side);
    button.textContent = 'Puntos para ' + board.names[i];
    button.disabled = !!played.award;
  });
  $('next').disabled = !played.award || game.round === 4 || (game.round === 3 && winner !== null);
  $('status').textContent = winner !== null ? 'Ganó ' + board.names[winner] :
    played.award ? 'Ronda cerrada · ' + played.award.points + ' puntos para ' + board.names[played.award.team] :
    played.strikes === 3 ? 'Tres errores. Dale al otro equipo la oportunidad de robar.' :
    'Elige el equipo que se lleva los puntos cuando termine la ronda.';
}
$('project').onclick = () => {
  unlockSound();
  screen = window.open('./pantalla.html', 'kronix-pingos-stage', 'popup,width=1200,height=720');
  $('connection').textContent = screen ?
    'Mueve la ventana al televisor en modo Extender y pulsa Pantalla completa.' :
    'Permite las ventanas emergentes para abrir el tablero.';
};
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.source === screen && event.data?.type === 'pingos-ready') publish();
});
document.addEventListener('pointerdown', unlockSound, {once:true});
$('match').onchange = event => change(() => state.match = Number(event.target.value));
$('round').onchange = event => change(() => active().round = Number(event.target.value), 'round');
$('left').onchange = event => change(() => active().names[0] = event.target.value);
$('right').onchange = event => change(() => active().names[1] = event.target.value);
$('mute').onchange = event => {state.mute = event.target.checked; saveAndRender();};
$('question-toggle').onclick = () => change(() => roundState().show = !roundState().show);
$('strike').onclick = () => change(() => roundState().strikes++, 'miss');
$('clear').onclick = () => change(() => roundState().strikes = 0);
$('undo').onclick = () => {
  const previous = history.pop();
  if (!previous) return;
  state = {...previous, mute:state.mute};
  saveAndRender();
};
function award(team) {
  change(() => {
    const played = roundState();
    played.award = {team, points:pointsFor(state.match, active().round, played)};
  }, 'award');
}
$('award-left').onclick = () => award(0);
$('award-right').onclick = () => award(1);
$('next').onclick = () => change(() => active().round++, 'round');
render();
if (room) {
  renderTeamLinks();
  scheduleScores(0);
}
