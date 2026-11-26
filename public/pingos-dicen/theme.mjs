const sharedKey = 'kronix-bingo-theme';
const stageKey = 'kronix-pingos-stage-theme';
const themes = {
  default: ['Original', '#101316'],
  neon: ['Neon Blue · Futurista', '#071321'],
  kronix: ['KroniX · Blanco, azul y verde', '#f3f8fd'],
  fiesta: ['Fiesta · Colores vivos', '#211235'],
  crema: ['Crema', '#f7f0e3'],
  party: ['Bingo Party', '#fff4ce'],
  studio: ['Escenario · Pingos Dicen', '#100d2c'],
};
function preference() {
  try {
    return localStorage.getItem(stageKey) === 'studio' ? 'studio' : localStorage.getItem(sharedKey);
  } catch { return null; }
}
const picker = document.getElementById('theme');
function apply(value) {
  const theme = Object.hasOwn(themes, value) ? value : 'default';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = themes[theme][1];
  if (picker) picker.value = theme;
}
if (picker) {
  Object.entries(themes).forEach(([value, [label]]) => picker.add(new Option(label, value)));
  picker.addEventListener('change', () => {
    const theme = picker.value;
    apply(theme);
    try {
      if (theme === 'studio') localStorage.setItem(stageKey, theme);
      else {
        localStorage.setItem(sharedKey, theme);
        localStorage.removeItem(stageKey);
      }
    } catch {}
  });
}
apply(preference());
window.addEventListener('storage', event => {
  if (event.key === sharedKey || event.key === stageKey || event.key === null) apply(preference());
});
