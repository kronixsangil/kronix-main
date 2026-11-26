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
  async function update() {
    try {
      const response = await fetch('/api/pingos-dicen?' + new URLSearchParams({room, team}), {cache:'no-store', signal:AbortSignal.timeout(5000)});
      if (!response.ok) throw new Error();
      const {name, points} = await response.json();
      document.querySelector('#team').textContent = name;
      document.querySelector('#points').textContent = points;
      status.textContent = '';
    } catch {
      status.textContent = 'Esperando conexión con el marcador…';
    } finally {
      setTimeout(update, 1500);
    }
  }
  update();
}
