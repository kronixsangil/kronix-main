import {phases, newState, questionFor, pointsFor, winnerFor, projection, teamScores, roundLabels, teamSlot, resolveSteal, answerFaceoff} from './game.mjs';
import {sound, unlockSound, setVolume, stopEffects} from './sound.mjs';

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
let buzzer = null;
let buzzTimeout;
try {room = JSON.parse(sessionStorage.getItem(storageKey + '.room'));} catch {}
const history = [];
const allRounds = roundLabels;
const active = () => state.games[state.match];
const roundState = () => active().rounds[active().round];
function publish(effect = '') {
  if (!screen || screen.closed) return;
  const board = projection(state);
  if (waitingForBuzz()) board.active = null;
  screen.postMessage({type:'pingos-board', board, effect}, location.origin);
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
      body:JSON.stringify({secret:room?.secret ?? null, teams:teamScores(state), buzzer}),
      signal:AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error();
    const result = await response.json();
    room = {room:result.room, secret:result.secret};
    $('show-buzzer').disabled = !canShowBuzzer();
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
function buzzerSlots() {
  return [0,1].map(side => teamSlot(state,state.match,side));
}
function waitingForBuzz() {
  return buzzer !== null && buzzer.winner === null;
}
function canShowBuzzer() {
  const played = roundState();
  return !!room && !buzzer && !buzzerSlots().includes(null) && !played.award &&
    !played.reveal.length && !played.strikes && (!played.duel || played.duel.turn === 'retry');
}
function pollBuzz(id) {
  clearTimeout(buzzTimeout);
  buzzTimeout = setTimeout(async () => {
    if (buzzer?.id !== id || buzzer.mode !== 'armed' || buzzer.second != null) return;
    try {
      const query = new URLSearchParams({room:room.room, team:buzzer.teams[0]});
      const response = await fetch('/api/pingos-dicen?' + query, {cache:'no-store',signal:AbortSignal.timeout(3000)});
      if (!response.ok) throw new Error();
      const data = (await response.json()).buzzer;
      if (buzzer?.id === id && data?.id === id && data.winner != null) {
        const firstPulse = buzzer.winner === null;
        buzzer.winner = data.winner;
        buzzer.second = data.second;
        const played = roundState();
        if (firstPulse) played.duel = {first:buzzer.teams.indexOf(data.winner), turn:'first'};
        if (data.second != null) played.duel.second = buzzer.teams.indexOf(data.second);
        if (firstPulse || data.second != null) saveAndRender(firstPulse ? 'buzz' : '');
        if (data.second != null) return;
      }
    } catch {}
    if (buzzer?.id === id) pollBuzz(id);
  }, 400);
}
function hideBuzzer() {
  buzzer = null;
  clearTimeout(buzzTimeout);
}
function updateBuzzer() {
  render();
  publish();
  scheduleScores(0);
}
$('show-buzzer').onclick = () => {
  const teams = buzzerSlots();
  if (!canShowBuzzer()) return;
  buzzer = {id:crypto.randomUUID(), mode:'ready', teams, winner:null};
  updateBuzzer();
};
$('arm-buzzer').onclick = () => {
  if (buzzer?.mode !== 'ready') return;
  buzzer.mode = 'armed';
  updateBuzzer();
  pollBuzz(buzzer.id);
};
$('hide-buzzer').onclick = () => { hideBuzzer(); updateBuzzer(); };
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
  const stealing = played.strikes === 3 && !played.award;
  const owner = played.owner ?? 0;
  const faceoff = ['first','second'].includes(played.duel?.turn);
  const waiting = waitingForBuzz() || played.duel?.turn === 'retry';
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
  $('round-label').textContent = board.label;
  $('possession').replaceChildren(...board.names.map((name,i) => new Option(name,i)));
  $('possession').value = owner;
  $('possession').disabled = !!played.award || stealing || faceoff || waiting;
  $('show-buzzer').disabled = !canShowBuzzer();
  $('first-team').textContent = board.first === null ? '—' : board.names[board.first];
  $('active-team').textContent = waiting || board.active === null ? '—' : board.names[board.active];
  $('arm-buzzer').disabled = buzzer?.mode !== 'ready';
  $('hide-buzzer').disabled = !buzzer;
  $('buzzer-status').textContent = waitingForBuzz() ? (buzzer.mode === 'armed' ? 'Pulsador abierto' : 'Visible y bloqueado') :
    board.second !== null ? 'Pulsó después ' + board.names[board.second] :
    buzzer?.winner != null ? 'Primera pulsación registrada' : 'Pulsador oculto';
  $('question-toggle').textContent = played.show ? 'Ocultar pregunta' : 'Mostrar pregunta';
  $('answers').replaceChildren(...answers.map(([answer, votes], i) => {
    const button = document.createElement('button');
    const shown = played.reveal.includes(i);
    button.className = shown ? 'revealed' : '';
    button.disabled = shown || waiting;
    button.textContent = (i + 1) + ' · ' + answer + ' · ' + votes + ' votos' + (shown ? ' ✓' : '');
    button.onclick = () => {
      const complete = played.reveal.length + 1 === answers.length;
      if (faceoff) {
        change(() => {
          answerFaceoff(state.match, game.round, played, i);
          if (played.duel.turn === 'done') hideBuzzer();
        }, complete ? 'complete' : 'hit');
      } else if (stealing) {
        hideBuzzer();
        change(() => resolveSteal(state.match, game.round, played, i), complete ? 'complete' : 'award');
      } else change(() => played.reveal.push(i), complete ? 'complete' : 'hit');
    };
    return button;
  }));
  $('pool').textContent = board.pool;
  $('errors').textContent = played.strikes + ' / 3' + (board.stealMiss ? ' + ✕' : '');
  $('score').textContent = board.scores.join(' – ');
  $('strike').disabled = waiting || !!played.award || (!stealing && played.reveal.length === answers.length);
  $('strike').textContent = faceoff ? '✕ Falló en el cara a cara' : stealing ? '✕ Falló el robo' : '✕ Marcar error';
  $('clear').disabled = played.strikes === 0;
  $('undo').disabled = history.length === 0;
  ['left','right'].forEach((side, i) => {
    const button = $('award-' + side);
    button.textContent = 'Puntos para ' + board.names[i];
    button.disabled = !!played.award || stealing || faceoff || waiting;
  });
  $('next').disabled = !played.award || game.round === 4 || (game.round === 3 && winner !== null);
  $('status').textContent = played.award ?
    (played.steal === 'missed' ? 'Robo fallido · ' : played.steal === 'won' ? 'Robo acertado · ' : '') + played.award.points + ' puntos para ' + board.names[played.award.team] + (winner !== null ? ' · Ganó ' + board.names[winner] : '') :
    played.duel?.turn === 'retry' ? 'Ambos fallaron. Muestra y abre el pulsador para repetir.' :
    faceoff ? board.names[board.active] + (played.duel.turn === 'first' ? ' responde primero. Busquen la respuesta más votada.' : ' responde. Si supera la primera respuesta, gana el turno.') :
    stealing ? board.names[1 - owner] + ' intenta robar. Revela su acierto o marca el fallo.' :
    waitingForBuzz() ? 'Espera la primera pulsación.' :
    played.duel?.turn === 'done' ? board.names[owner] + ' ganó el turno y sigue jugando.' :
    'Muestra el pulsador para iniciar el cara a cara, o asigna el turno manualmente.';
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
$('match').onchange = event => { hideBuzzer(); change(() => state.match = Number(event.target.value)); };
$('round').onchange = event => { hideBuzzer(); change(() => active().round = Number(event.target.value), 'round'); };
$('left').onchange = event => change(() => active().names[0] = event.target.value);
$('right').onchange = event => change(() => active().names[1] = event.target.value);
$('mute').onchange = event => {state.mute = event.target.checked; if (state.mute) stopEffects(); saveAndRender();};
$('question-toggle').onclick = () => change(() => roundState().show = !roundState().show);
$('possession').onchange = event => change(() => roundState().owner = Number(event.target.value));
$('strike').onclick = () => {
  const played = roundState();
  if (['first','second'].includes(played.duel?.turn)) {
    change(() => {
      answerFaceoff(state.match, active().round, played);
      if (played.duel.turn !== 'second') hideBuzzer();
    }, 'faceoff-miss');
    return;
  }
  if (played.strikes >= 2) hideBuzzer();
  if (played.strikes === 3) change(() => resolveSteal(state.match, active().round, played), 'steal-miss');
  else change(() => played.strikes++, 'miss');
};
$('clear').onclick = () => change(() => roundState().strikes = 0);
$('undo').onclick = () => {
  const previous = history.pop();
  if (!previous) return;
  hideBuzzer();
  state = {...previous, mute:state.mute};
  saveAndRender();
};
function award(team) {
  hideBuzzer();
  change(() => {
    const played = roundState();
    played.award = {team, points:pointsFor(state.match, active().round, played)};
  }, 'award');
}
$('award-left').onclick = () => award(0);
$('award-right').onclick = () => award(1);
$('next').onclick = () => { hideBuzzer(); change(() => active().round++, 'round'); };
$('effects').addEventListener('click', event => {
  const effect = event.target.closest('button')?.dataset.sound;
  if (effect === 'stop') stopEffects();
  else if (effect && !state.mute) sound(effect);
});
render();
if (room) {
  renderTeamLinks();
  scheduleScores(0);
}
