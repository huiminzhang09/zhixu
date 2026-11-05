/* Shared presentation controls; account validation remains in the existing modules. */
(() => {
  const eye = hidden => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${hidden ? '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A11.4 11.4 0 0 1 12 5c5.5 0 9 7 9 7a18 18 0 0 1-3.1 3.9M6.2 6.2C4.1 8.1 3 12 3 12s3.5 7 9 7a10 10 0 0 0 5.8-1.8"/>' : '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'}</svg>`;
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-password-toggle]');
    if (!button) return;
    const input = document.getElementById(button.dataset.passwordToggle);
    if (!input) return;
    const shown = input.type === 'password';
    input.type = shown ? 'text' : 'password';
    button.innerHTML = eye(!shown);
    button.setAttribute('aria-label', shown ? '隐藏密码' : '显示密码');
    button.setAttribute('aria-pressed', String(shown));
  });
  document.addEventListener('reset', event => {
    event.target.querySelectorAll('[data-password-toggle]').forEach(button => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (input) input.type = 'password';
      button.innerHTML = eye(true);button.setAttribute('aria-pressed', 'false');button.setAttribute('aria-label', '显示密码');
    });
  });
  const audio = document.querySelector('#authBrandAudio'), button = document.querySelector('[data-auth-audio]');
  if (audio && button) {
    const update = () => {
      button.setAttribute('aria-label', audio.paused ? '播放品牌演示音乐' : '暂停品牌演示音乐');
      button.setAttribute('aria-pressed', String(!audio.paused));
      button.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true">${audio.paused ? '<path fill="currentColor" d="M6 3.5 16 10 6 16.5Z"/>' : '<path stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M7 5v10m6-10v10"/>'}</svg>`;
    };
    button.addEventListener('click', async () => {
      if (!audio.paused) { audio.pause(); return; }
      try { await audio.play(); }
      catch { document.querySelector('[data-auth-audio-message]').textContent = '音频暂时无法播放，请重试。'; }
    });
    audio.addEventListener('play', update);audio.addEventListener('pause', update);
    window.addEventListener('pagehide', () => audio.pause());
  }
})();
