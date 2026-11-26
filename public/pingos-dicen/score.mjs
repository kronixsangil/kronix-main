const params = new URLSearchParams(location.search);
const room = params.get('room');
const team = params.get('team');
const status = document.querySelector('#score-status');
const install = document.querySelector('#install');
if (!/^[a-f0-9-]{36}$/.test(room ?? '') || !/^[0-7]$/.test(team ?? '')) {
  status.textContent = 'Abre el enlace que te dé el presentador.';
} else {
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = '/api/pingos-dicen?manifest=1&' + new URLSearchParams({room, team});
  document.head.append(manifest);
  navigator.serviceWorker?.register('./worker.js').catch(() => {});
  let deferred;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferred = event;
    install.hidden = false;
  });
  install.onclick = async () => {
    if (!deferred) return;
    await deferred.prompt();
    deferred = null;
    install.hidden = true;
  };
  const buzzerPanel = document.querySelector('#buzzer-panel');
  const button = document.querySelector('#team-buzzer');
  const note = document.querySelector('#buzz-note');
  let state;
  let inFlight = false;
  let revision = 0;
  function render(data) {
    const {name, points, buzzer} = data;
    state = buzzer;
    document.querySelector('#team').textContent = name;
    document.querySelector('#points').textContent = points;
    buzzerPanel.hidden = !buzzer;
    button.disabled = inFlight || buzzer?.mode !== 'armed' || buzzer.winner !== null;
    note.textContent = buzzer?.winner != null ? (buzzer.winner === Number(team) ? '¡Responden primero!' : 'Responde primero ' + buzzer.winnerName) :
      buzzer?.mode === 'armed' ? '¡Pulsa ahora!' : 'Esperen la señal';
  }
  button.onclick = async () => {
    if (button.disabled || !state) return;
    inFlight = true;
    button.disabled = true;
    const current = ++revision;
    let result;
    try {
      const response = await fetch('/api/pingos-dicen', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({type:'buzz',room,team:Number(team),id:state.id}),
        signal:AbortSignal.timeout(4000),
      });
      if (!response.ok) throw new Error();
      result = await response.json();
    } catch {
      note.textContent = 'No se confirmó la pulsación.';
    } finally {
      inFlight = false;
      if (current === revision && result) render(result);
      else if (!result) buzzerPanel.hidden = true;
    }
  };
  async function update() {
    const current = revision;
    try {
      const response = await fetch('/api/pingos-dicen?' + new URLSearchParams({room, team}), {cache:'no-store', signal:AbortSignal.timeout(5000)});
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (current === revision && !inFlight) render(data);
      status.textContent = '';
    } catch {
      button.disabled = true;
      status.textContent = 'Esperando conexión con el marcador…';
    } finally {
      setTimeout(update, 650);
    }
  }
  update();
}
