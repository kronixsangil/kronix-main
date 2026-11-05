(() => {
  const key = 'kronix-bingo-theme';
  const themes = {
    default: { label: 'Original', color: '#101316' },
    neon: { label: 'Neon Blue · Futurista', color: '#071321' },
    kronix: { label: 'KroniX · Blanco, azul y verde', color: '#f3f8fd' },
    fiesta: { label: 'Fiesta · Colores vivos', color: '#211235' },
    crema: { label: 'Crema', color: '#f7f0e3' },
  };
  let current = 'default';
  function apply(value) {
    current = Object.hasOwn(themes, value) ? value : 'default';
    document.documentElement.dataset.theme = current;
    document.querySelector('meta[name="theme-color"]').content = themes[current].color;
    const selector = document.getElementById('themeSelect');
    if (selector) selector.value = current;
  }
  try { apply(localStorage.getItem(key) || 'default'); } catch { apply('default'); }
  document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('themeSelect');
    selector.value = current;
    selector.addEventListener('change', () => {
      apply(selector.value);
      const status = document.getElementById('themeStatus');
      status.textContent = 'Tema ' + themes[current].label + ' activado.';
      try { localStorage.setItem(key, current); }
      catch { status.textContent += ' No se pudo guardar la preferencia en este navegador.'; }
    });
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(event.newValue || 'default');
  });
})();
