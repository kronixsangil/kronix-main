(() => {
  const panel = document.getElementById('masterPanel');
  const button = document.getElementById('expandBoard');
  let expanded = false, nativeFullscreen = false, previousFocus;
  const blocked = new Map();
  function restore() {
    if (!expanded) return;
    expanded = false;
    nativeFullscreen = false;
    panel.classList.remove('is-expanded');
    document.body.classList.remove('board-only');
    button.textContent = '⛶ Ampliar';
    button.setAttribute('aria-expanded', 'false');
    blocked.forEach((wasInert, node) => { node.inert = wasInert; });
    blocked.clear();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  async function close() {
    if (document.fullscreenElement === panel) {
      try { await document.exitFullscreen(); } catch { /* The fixed layout can still be closed. */ }
    }
    restore();
  }
  button.addEventListener('click', async () => {
    if (expanded) { await close(); return; }
    previousFocus = document.activeElement;
    expanded = true;
    panel.classList.add('is-expanded');
    document.body.classList.add('board-only');
    button.textContent = '⛶ Reducir · Esc';
    button.setAttribute('aria-expanded', 'true');
    // Keep only the board reachable by keyboard, including in fullscreen fallback.
    for (let node = panel; node.parentElement && node !== document.body; node = node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling !== node && sibling instanceof HTMLElement && sibling.tagName !== 'DIALOG') {
          blocked.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
    }
    button.focus({ preventScroll: true });
    try {
      if (panel.requestFullscreen) {
        await panel.requestFullscreen();
        nativeFullscreen = document.fullscreenElement === panel;
      }
    } catch { /* The expanded layout fills the viewport when fullscreen is unavailable. */ }
    if (!expanded && document.fullscreenElement === panel) await document.exitFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === panel) nativeFullscreen = true;
    else if (nativeFullscreen) restore();
  });
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]')) return;
    if (expanded && event.key === 'Escape') { event.preventDefault(); void close(); }
    if (expanded && event.key === 'Tab') { event.preventDefault(); button.focus(); }
  });
})();
