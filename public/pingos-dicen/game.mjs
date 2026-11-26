import questions from './questions.mjs';

export const multipliers = [1, 1, 2, 3, 1];
export const phases = ['Cuartos de final', 'Cuartos de final', 'Cuartos de final', 'Cuartos de final', 'Semifinal', 'Semifinal', 'Final'];
const bracket = [[0, 1], [2, 3], [4, 5]];
export const newRound = () => ({reveal: [], strikes: 0, award: null, show: true});
export const newState = () => ({
  match: 0, mute: false,
  games: phases.map((_, i) => ({
    names: i < 4 ? ['Equipo ' + (2 * i + 1), 'Equipo ' + (2 * i + 2)] : ['', ''],
    round: 0, rounds: Array.from({length: 5}, newRound),
  })),
});
export function questionFor(match, round) {
  return questions[round < 4 ? 4 * match + round : 28 + match];
}
export function pointsFor(match, round, played) {
  const {answers} = questionFor(match, round);
  return played.reveal.reduce((sum, index) => sum + answers[index][1], 0) * multipliers[round];
}
export function scoresFor(game) {
  return game.rounds.reduce((scores, round) => {
    if (round.award) scores[round.award.team] += round.award.points;
    return scores;
  }, [0, 0]);
}
export function winnerFor(game) {
  const [left, right] = scoresFor(game);
  if (!game.rounds.slice(0, 4).every(round => round.award) || left === right) return null;
  return left > right ? 0 : 1;
}
export function namesFor(state, match) {
  const sources = bracket[match - 4];
  return state.games[match].names.map((name, i) => {
    if (name.trim()) return name.trim();
    if (!sources) return 'Equipo ' + (match * 2 + i + 1);
    const prior = sources[i];
    const winner = winnerFor(state.games[prior]);
    return winner === null ? 'Ganador juego ' + (prior + 1) : namesFor(state, prior)[winner];
  });
}
function teamSlot(state, match, side) {
  if (match < 4) return match * 2 + side;
  const prior = bracket[match - 4][side];
  const winner = winnerFor(state.games[prior]);
  return winner === null ? null : teamSlot(state, prior, winner);
}
export function teamScores(state) {
  const teams = Array(8);
  state.games.forEach((game, match) => {
    const names = namesFor(state, match);
    const scores = scoresFor(game);
    const started = match < 4 || match === state.match ||
      game.rounds.some(round => round.award || round.reveal.length || round.strikes);
    if (!started) return;
    names.forEach((name, side) => {
      const slot = teamSlot(state, match, side);
      if (slot !== null) teams[slot] = {name, points:scores[side]};
    });
  });
  return teams;
}
export function projection(state) {
  const {match} = state;
  const game = state.games[match];
  const {round} = game;
  const played = game.rounds[round];
  const {question, answers} = questionFor(match, round);
  const names = namesFor(state, match);
  const winner = winnerFor(game);
  return {
    id: match + ':' + round, phase: phases[match], match: match + 1,
    question: played.show ? question : '', names, scores: scoresFor(game),
    tiles: answers.map((answer, i) => played.reveal.includes(i) ? answer : null),
    strikes: played.strikes, pool: played.award ? 0 : pointsFor(match, round, played),
    multiplier: multipliers[round], reserve: round === 4,
    winner: winner === null ? '' : names[winner],
  };
}
