const games = [
  {name: "Bingo", href: "/bingo"},
  {name: "Copacabana", href: "/copacabana"},
  {name: "Pingos Dicen", href: "/pingos-dicen"},
];

export default function GameNavigation() {
  return (
    <details className="kronix-games">
      <summary>Juegos <span aria-hidden="true">⌄</span></summary>
      <ul>
        {games.map(game => <li key={game.href}><a href={game.href}>{game.name}</a></li>)}
      </ul>
    </details>
  );
}
