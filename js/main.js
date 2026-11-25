import { Game } from './game.js';

function showFatalError(error) {
  console.error('[Cinzas de Valdoria] Falha ao iniciar:', error);
  const host = document.getElementById('frame') || document.body;
  const panel = document.createElement('div');
  panel.setAttribute('role', 'alert');
  panel.style.cssText = [
    'position:absolute', 'inset:0', 'z-index:200', 'display:grid', 'place-items:center',
    'padding:8%', 'background:#05070cf2', 'color:#eee2c9', 'text-align:center',
    'font-family:Georgia,serif'
  ].join(';');
  panel.innerHTML = `
    <div style="max-width:520px">
      <p style="letter-spacing:.3em;color:#e2b45e;font-size:11px;margin:0 0 10px">CINZAS DE VALDORIA</p>
      <h1 style="font-size:28px;margin:0 0 12px">A chama não acendeu</h1>
      <p style="color:#b3ab99;line-height:1.6;margin:0 0 20px">
        O jogo encontrou um erro ao iniciar. Recarregue a página para tentar novamente.
      </p>
      <button id="fatal-reload" style="padding:10px 22px;border:1px solid #e7c173;background:#c9963f;color:#21180b;font-weight:700;letter-spacing:.08em;cursor:pointer">
        Recarregar
      </button>
      <pre style="margin:18px 0 0;padding:10px;overflow:auto;text-align:left;font-size:10px;color:#9d947f;background:#0a0d15;border:1px solid #c79a4c33">${String(error && (error.stack || error.message) || error)}</pre>
    </div>`;
  host.appendChild(panel);
  panel.querySelector('#fatal-reload')?.addEventListener('click', () => window.location.reload());
}

function boot() {
  try {
    const game = new Game();
    document.body.dataset.cinzasReady = 'true';
    return game;
  } catch (error) {
    showFatalError(error);
    return null;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Cinzas de Valdoria] Promessa rejeitada:', event.reason);
});
