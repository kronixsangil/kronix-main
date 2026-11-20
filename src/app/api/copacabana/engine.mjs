import { randomInt } from 'node:crypto';

export const avatars = ['🦜', '🐆', '🦊', '🐙', '🦉', '🐸', '🦋', '🐢', '🦩', '🐒', '🐬', '🦀'];
const top = (pile) => pile.at(-1);
const pick = (items) => items[randomInt(items.length)];

function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function deck(jokers) {
  const cards = [];
  for (let copy = 0; copy < 2; copy++) {
    for (const suit of ['♠', '♥', '♣', '♦']) {
      for (let rank = 1; rank <= 13; rank++) cards.push({ rank, suit });
    }
  }
  if (jokers) cards.push({ rank: 0 }, { rank: 0 });
  return shuffle(cards);
}

function record(game, event) {
  game.motion ??= [];
  const id = (game.motion.at(-1)?.id ?? 0) + 1;
  game.motion.push({ ...event, id });
  if (game.motion.length > 32) game.motion.shift();
}

function recycle(game) {
  const collect = (pile, keep, from) => {
    const cards = pile.splice(0, Math.max(0, pile.length - keep));
    if (cards.length) record(game, { type: 'collect', from, count: cards.length });
    return cards;
  };
  if (game.completed.length) return shuffle(collect(game.completed, 0, 'completed'));
  const buried = game.players.flatMap((player, seat) =>
    player.slots.flatMap((pile, slot) => collect(pile, 1, 'slot-' + seat + '-' + slot)));
  if (buried.length) return shuffle(buried);
  return shuffle(game.center.flatMap(({ cards }, index) => collect(cards, 1, 'center-' + index)));
}

function draw(game, player, initial = false) {
  const before = player.hand.length;
  while (player.hand.length < 5) {
    if (!game.stock.length) game.stock = recycle(game);
    if (!game.stock.length) break;
    player.hand.push(game.stock.pop());
  }
  if (!initial && player.hand.length > before) {
    record(game, { type: 'draw', seat: game.players.indexOf(player), count: player.hand.length - before });
  }
}

export function startGame(players, settings, now) {
  const stock = deck(settings.jokers);
  const game = {
    players: players.map(({ name, avatar, bot }) => ({ name, avatar, bot, hand: [], slots: [[], [], [], []], goal: [] })),
    settings, stock, center: Array.from({ length: 4 }, () => ({ rank: 0, cards: [] })),
    completed: [], turn: randomInt(players.length), version: 0, rounds: 0,
    turns: 0, turnMoves: 0, progress: false, quiet: 0, grace: false, prompt: null, winner: null,
    notice: 'Comenzó la partida.',
  };
  for (const player of game.players) {
    draw(game, player, true);
    for (const pile of player.slots) {
      const index = stock.findLastIndex((card) => card.rank !== 0);
      pile.push(stock.splice(index, 1)[0]);
    }
    player.goal = stock.splice(-settings.goal);
  }
  resetClock(game, now, true);
  return game;
}

function resetClock(game, now, opening = false) {
  game.deadline = now + game.settings.seconds * (opening ? 2000 : 1000);
  game.botAt = now + 700;
}

function sources(player) {
  return [
    ...player.hand.map((card, index) => ({ from: 'hand', index, card })),
    ...player.slots.flatMap((pile, index) => pile.length ? [{ from: 'slot', index, card: top(pile) }] : []),
    ...(player.goal.length ? [{ from: 'goal', index: 0, card: top(player.goal) }] : []),
  ];
}

function centerMoves(game, player) {
  return sources(player).flatMap(({ from, index, card }) => game.center.flatMap(({ rank }, to) =>
    card.rank === 0 || card.rank === rank + 1 ? [{ from, index, target: 'center', to }] : []));
}

function finish(game, winner, notice) {
  game.winner = winner;
  game.prompt = null;
  game.notice = notice;
}

function nextTurn(game, now) {
  game.turn = (game.turn + 1) % game.players.length;
  game.turns++;
  game.turnMoves = 0;
  game.grace = false;
  const player = game.players[game.turn];
  draw(game, player);
  resetClock(game, now, true);
  if (game.turns % game.players.length !== 0) return;
  game.rounds++;
  game.quiet = game.progress ? 0 : game.quiet + 1;
  game.progress = false;
  if (game.quiet < 5) return;
  const candidates = game.players.map((seat, index) => ({ seat, index, moves: centerMoves(game, seat) }));
  const recyclable = [
    ...game.stock, ...game.completed,
    ...game.center.flatMap(({ cards }) => cards.slice(0, -1)),
    ...game.players.flatMap(({ slots }) => slots.flatMap((pile) => pile.slice(0, -1))),
  ];
  const canBuild = recyclable.some((card) => card.rank === 0 || game.center.some(({ rank }) => card.rank === rank + 1));
  const blocker = candidates.find(({ seat, moves }) => !seat.bot && moves.length)
    ?? candidates.find(({ seat }) => !seat.bot);
  if (!canBuild && !candidates.some(({ moves }) => moves.length)) {
    finish(game, -1, 'Empate. La mesa quedó bloqueada.');
  } else if (blocker) {
    game.prompt = { seat: blocker.index, deadline: now + 30_000 };
    game.notice = 'Cinco rondas sin jugar cartas objetivo.';
  }
  game.quiet = 0;
}

function ownMoves(player) {
  const empty = player.slots.some((pile) => !pile.length);
  return player.hand.flatMap((card, index) => card.rank === 0 ? [] :
    player.slots.flatMap((pile, to) => (!empty || !pile.length) ? [{ from: 'hand', index, target: 'slot', to }] : []));
}

export function legalMoves(game) {
  if (game.winner !== null || game.prompt) return [];
  const player = game.players[game.turn];
  const center = centerMoves(game, player);
  if (!game.grace) return [...center, ...ownMoves(player)];
  const own = ownMoves(player);
  return own.length ? own : center.filter(({ from, index }) => from === 'hand' && player.hand[index].rank === 0);
}

export function play(game, move, now) {
  const legal = legalMoves(game).some(({ from, index, target, to }) =>
    move.from === from && move.index === index && move.target === target && move.to === to);
  if (!legal) return false;
  const player = game.players[game.turn];
  game.version++;
  game.turnMoves++;
  const seat = game.turn;
  if (move.target === 'slot') {
    const pile = player.slots[move.to];
    const closesTurn = pile.length > 0;
    const card = player.hand.splice(move.index, 1)[0];
    pile.push(card);
    record(game, { type: 'play', seat, from: 'hand', index: move.index, target: 'slot', to: move.to, card });
    if (closesTurn) {
      game.notice = player.name + ' remontó y terminó su turno.';
      nextTurn(game, now);
    } else {
      if (!player.hand.length) draw(game, player);
      if (!game.grace) resetClock(game, now);
    }
    return true;
  }
  const card = move.from === 'goal' ? player.goal.pop() : move.from === 'slot'
    ? player.slots[move.index].pop() : player.hand.splice(move.index, 1)[0];
  const pile = game.center[move.to];
  pile.cards.push(card);
  pile.rank++;
  record(game, { type: 'play', seat, from: move.from, index: move.index, target: 'center', to: move.to, card, effective: pile.rank });
  game.notice = player.name + ' jugó ' + (card.rank === 0 ? 'un comodín' : 'al centro') + '.';
  if (pile.rank === 13) {
    record(game, { type: 'complete', to: move.to });
    game.completed.push(...pile.cards);
    pile.cards = [];
    pile.rank = 0;
    game.notice = player.name + ' completó una secuencia de A a K.';
  }
  if (move.from === 'goal') {
    game.progress = true;
    game.notice = player.name + ' jugó una carta objetivo.';
    if (!player.goal.length) {
      finish(game, game.turn, player.name + ' ganó al vaciar su montón objetivo.');
      return true;
    }
  }
  if (!player.hand.length) draw(game, player);
  if (!game.grace) resetClock(game, now);
  return true;
}

export function decide(game, accept, now) {
  game.version++;
  if (accept) finish(game, -1, 'Empate aceptado.');
  else {
    game.prompt = null;
    game.notice = 'La partida continúa.';
    resetClock(game, now, game.turnMoves === 0);
  }
}

function forceClose(game, now) {
  const player = game.players[game.turn];
  const turn = game.turns;
  // Every iteration fills a space, spends a joker, or ends the turn.
  while (game.turns === turn && game.winner === null) {
    if (!player.hand.length) draw(game, player);
    const choices = legalMoves(game);
    if (!choices.length) {
      finish(game, -1, 'Empate. Se agotaron las opciones para cerrar el turno.');
      break;
    }
    const move = pick(choices);
    play(game, move, now);
    if (move.target === 'center' && game.turns === turn) {
      game.grace = false;
      resetClock(game, now);
      game.notice = player.name + ' jugó un comodín automáticamente y puede continuar.';
      break;
    }
  }
}

function nextRanks(board) {
  return board.map((rank) => rank + 1);
}

function threat(board, rivals) {
  const next = nextRanks(board);
  return rivals.reduce((cost, { goal, count, exposed, immediate }) => {
    const urgency = count === 1 ? 3.5 : count <= 3 ? 1.7 : 1;
    if (goal === 0 || next.includes(goal)) return cost + 27 * urgency * immediate;
    const bridge = goal === 1 ? 13 : goal - 1;
    if (next.includes(bridge) && (exposed.includes(bridge) || exposed.includes(0))) {
      return cost + 10 * urgency * immediate;
    }
    return cost;
  }, 0);
}

function candidatesForBot(position) {
  const { hand, slots, goal, board } = position;
  const next = nextRanks(board);
  const cards = [
    ...(goal ? [{ from: 'goal', index: 0, card: goal }] : []),
    ...hand.map((card, index) => ({ from: 'hand', index, card })),
    ...slots.flatMap((pile, index) => pile.length ? [{ from: 'slot', index, card: top(pile) }] : []),
  ];
  return cards.flatMap((source) => next.flatMap((rank, to) =>
    next.indexOf(rank) === to && (source.card.rank === rank || source.card.rank === 0)
      ? [{ ...source, target: 'center', to }] : []));
}

function evaluateBotPlay(position, move, rivals, depth, baseline) {
  const { board, hand, slots, goal } = position;
  const card = move.from === 'goal' ? goal : move.from === 'hand' ? hand[move.index] : top(slots[move.index]);
  const advanced = board.map((rank, index) => index === move.to ? (rank + 1) % 13 : rank);
  const risk = threat(advanced, rivals) - baseline;
  if (move.from === 'goal') return 125 - risk * .35;
  const remaining = move.from === 'hand' ? hand.filter((_, index) => index !== move.index) : hand;
  const piles = move.from === 'slot' ? slots.map((pile, index) => index === move.index ? pile.slice(0, -1) : pile) : slots;
  const holes = piles.filter((pile) => !pile.length).length;
  const normals = remaining.filter(({ rank }) => rank !== 0).length;
  const score = (move.from === 'hand' ? 5 : 3) + (remaining.length ? 0 : 11)
    - (card.rank === 0 ? 9 : 0) - (holes > normals && remaining.length ? 28 : 0) - (risk > 0 ? risk : risk * .45);
  if (depth === 1) return score;
  const next = { board: advanced, hand: remaining, slots: piles, goal };
  const futures = candidatesForBot(next);
  const updatedThreat = baseline + risk;
  const follow = Math.max(0, ...futures.map((future) => evaluateBotPlay(next, future, rivals, depth - 1, updatedThreat)));
  return score + follow * .72;
}

function botMove(game, now) {
  const player = game.players[game.turn];
  const moves = legalMoves(game);
  const own = moves.filter(({ target }) => target === 'slot');
  const holes = player.slots.filter((pile) => !pile.length).length;
  const normals = player.hand.filter((card) => card.rank !== 0).length;
  const position = {
    board: game.center.map(({ rank }) => rank),
    hand: player.hand,
    slots: player.slots.map((pile) => pile.slice(-3)),
    goal: top(player.goal),
  };
  const rivals = game.players.flatMap(({ goal, slots }, index) => index === game.turn || !goal.length ? [] : [{
    goal: top(goal).rank,
    count: goal.length,
    exposed: slots.map((pile) => top(pile)?.rank),
    immediate: index === (game.turn + 1) % game.players.length ? 1 : .55,
  }]);
  const baseline = threat(position.board, rivals);
  const ownScore = ({ index, to }) => {
    const rank = player.hand[index].rank;
    const under = top(player.slots[to])?.rank;
    const goal = position.goal?.rank;
    const helpsGoal = goal && rank < goal && goal - rank <= 3 ? 4 - (goal - rank) : 0;
    return (under === rank + 1 ? 4 : 0) + (rank === 1 ? 3 : 0) + helpsGoal
      + (nextRanks(position.board).includes(rank) ? 1 : 0) - (under === 1 ? 4 : 0);
  };
  const rankedOwn = own.map((move) => ({ move, score: ownScore(move) })).sort((a, b) => b.score - a.score);
  const center = moves.filter(({ target }) => target === 'center');
  const rankedCenter = center.map((move) => ({ move, score: evaluateBotPlay(position, move, rivals, 3, baseline) }))
    .sort((a, b) => b.score - a.score);
  const best = rankedCenter[0];
  const chosen = rankedCenter.find(({ move }) => move.from === 'goal')?.move
    ?? (game.turnMoves >= 16 && own.length ? rankedOwn[0].move : undefined)
    ?? (holes && normals <= holes && best?.score < 45 ? rankedOwn[0]?.move : undefined)
    ?? (best && (!own.length || best.score > Math.max(3, rankedOwn[0].score)) ? best.move : rankedOwn[0]?.move);
  if (chosen) play(game, chosen, now);
  else {
    game.grace = true;
    game.version++;
    forceClose(game, now);
  }
}

export function tick(game, now) {
  if (!game || game.winner !== null) return;
  if (game.prompt) {
    if (now >= game.prompt.deadline) decide(game, false, now);
    return;
  }
  if (game.players[game.turn].bot && now >= game.botAt) {
    botMove(game, now);
    return;
  }
  if (now < game.deadline) return;
  if (game.grace) {
    game.version++;
    forceClose(game, now);
    return;
  }
  game.grace = true;
  game.version++;
  game.deadline += 5000;
  game.notice = 'Tiempo agotado. Llena tus espacios y remonta.';
  if (now >= game.deadline) forceClose(game, now);
}

export function tableView(game, seat) {
  if (!game) return null;
  const { center, players, completed, stock, progress, quiet, turns, turnMoves, ...visible } = game;
  return {
    ...visible,
    stock: stock.length,
    completed: completed.length,
    center: center.map(({ rank, cards }) => ({ rank, card: top(cards) })),
    players: players.map(({ hand, slots, goal, ...profile }, index) => ({
      ...profile,
      handCount: hand.length,
      hand: index === seat ? hand : undefined,
      slots: slots.map((pile) => ({ card: top(pile), count: pile.length, cards: pile.slice(-3).reverse() })),
      goal: { card: top(goal), count: goal.length },
    })),
    moves: seat === game.turn ? legalMoves(game) : [],
  };
}
