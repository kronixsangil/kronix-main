const $ = id => document.getElementById(id);
let last;
let timeout;
function animate(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}
function render(board, effect) {
  const changedRound = last?.id !== board.id;
  $('phase').textContent = board.phase + ' · Juego ' + board.match;
  $('left-name').textContent = board.names[0];
  $('right-name').textContent = board.names[1];
  $('left-score').textContent = board.scores[0];
  $('right-score').textContent = board.scores[1];
  $('prompt').textContent = board.question || 'Pregunta oculta';
  $('multiplier').textContent = (board.reserve ? 'Reserva · ' : '') + '×' + board.multiplier;
  $('live-points').textContent = board.pool + ' puntos';
  $('marks').textContent = '✕'.repeat(board.strikes);
  $('marks').setAttribute('aria-label', board.strikes + ' errores');
  const winner = $('champion');
  winner.hidden = !board.winner;
  winner.textContent = board.winner ? (board.match === 7 ? '¡Campeón! ' : '¡Ganó ') + board.winner + (board.match === 7 ? '' : '!') : '';
  const tiles = $('tiles');
  if (changedRound) {
    tiles.replaceChildren(...board.tiles.map(() => document.createElement('li')));
    animate(tiles, 'entrance');
  }
  board.tiles.forEach((answer, i) => {
    const tile = tiles.children[i];
    if (!changedRound && last.tiles[i] === null && answer === null) return;
    if (!changedRound && last.tiles[i] !== null && answer !== null) return;
    const label = document.createElement('span');
    const score = document.createElement('b');
    label.textContent = answer ? answer[0] : i + 1;
    score.textContent = answer ? answer[1] : '';
    tile.replaceChildren(label, score);
    tile.classList.toggle('open', !!answer);
    if (!changedRound && answer) animate(tile, 'flip');
  });
  if (changedRound || effect !== 'miss' && board.strikes < (last?.strikes ?? 0)) $('flash').textContent = '';
  if (effect === 'miss') {
    $('flash').textContent = '✕'.repeat(board.strikes);
    animate($('flash'), 'impact');
    clearTimeout(timeout);
    timeout = setTimeout(() => $('flash').textContent = '', 1050);
  }
  if (effect === 'award') {
    animate($('live-points'), 'burst');
    if (board.winner) animate(winner, 'winner-pop');
  }
  last = board;
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== window.opener || event.data?.type !== 'pingos-board') return;
  render(event.data.board, event.data.effect);
});
window.opener?.postMessage({type:'pingos-ready'}, location.origin);
$('fullscreen').onclick = async () => {
  try {await document.documentElement.requestFullscreen();}
  catch {$('fullscreen').textContent = 'Usa F11 para pantalla completa';}
};
