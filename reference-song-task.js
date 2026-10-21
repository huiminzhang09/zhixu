/* Reference-song task example, with local audio for interactive previews. */
(() => {
  const reference = { title: '晨间来信 · 参考歌曲.wav', url: './assets/reference-song-demo.wav', durationSeconds: 32, bytes: 1024044, format: 'WAV', demo: true };
  const uploadedReferences = new Map(), pendingUploads = new Map();
  function referenceForTask(task) {
    if (!Object.prototype.hasOwnProperty.call(task, 'referenceAudio')) return reference;
    const uploaded = uploadedReferences.get(task.id);
    return task.referenceAudio?.id && uploaded?.id === task.referenceAudio.id ? uploaded : null;
  }
  function validateReference(task) {
    if (pendingUploads.has(task.id)) { showToast('音频正在读取，请稍候', 'error'); return false; }
    if (referenceForTask(task)) return true;
    showToast('请先上传参考歌曲', 'error');
    taskDetailPanel.querySelector('[data-reference-upload]')?.focus();
    return false;
  }
  const lyrics = '风经过窗台，唤醒沉睡的街\n我把昨日心事，折进新的书页\n远处的钟声，落在微亮的天\n你说每次出发，都能遇见晴天\n\n让晨光慢慢，铺满回家的路\n让未说的话，随晚风轻轻落幕\n我们走过雨，也看过云舒\n把平凡的日子，唱成温柔的祝福';
  const candidates = (fresh = false) => [
    { id: 'reference-song-a', title: '晨间来信 · 版本一', summary: '温暖钢琴 · 演示音频', url: './assets/reference-song-result-a.wav', durationSeconds: 24 },
    { id: 'reference-song-b', title: '晨间来信 · 版本二', summary: '轻快旋律 · 演示音频', url: './assets/reference-song-result-b.wav', durationSeconds: 28 }
  ].map(candidate => fresh ? { ...candidate, generationId: crypto.randomUUID() } : candidate);
  const info = text => `<span class="song-studio-info" tabindex="0" role="img" aria-label="${escapeHtml(text)}" data-tip="${escapeHtml(text)}">ⓘ</span>`;
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="5.5" cy="17.5" rx="3.5" ry="2.5"/><ellipse cx="16.5" cy="15.5" rx="3.5" ry="2.5"/></svg>';
  function transferIcon(download = false) {
    return `<svg class="song-studio-transfer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${download ? 'M8 4v8m-3-3 3 3 3-3' : 'M8 12V4m-3 3 3-3 3 3'}"/></svg>`;
  }
  function skipIcon(forward = false) {
    return `<svg class="song-studio-skip-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><g${forward ? ' transform="translate(32 0) scale(-1 1)"' : ''} fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.6 8.6a10.5 10.5 0 1 1-3.1 7.4"/><path d="M8.6 4v4.6h4.6"/></g><text x="16" y="17" text-anchor="middle" dominant-baseline="middle">15</text></svg>`;
  }
  function player(track, withFile = false, index = 0) {
    const heights = Array.from({ length: 56 }, (_, i) => 20 + Math.round(44 * Math.abs(Math.sin(i * .91 + index) * Math.cos(i * .27 + .7))));
    const waveform = heights.map((height, i) => `<path d="M${i * 10 + 5} ${40 - height / 2}v${height}"/>`).join('');
    const duration = track.durationSeconds;
    return `<div class="song-studio-player${withFile ? ' is-reference' : ''}" data-reference-player>
      ${withFile ? `<div class="song-studio-file"><i>${icon}</i><div><b>${escapeHtml(track.title)}</b><small>${(track.bytes / 1048576).toFixed(2)} MB / ${escapeHtml(track.format)} · ${track.demo ? '演示音频' : '本地音频'}</small></div></div>` : ''}
      <audio preload="metadata" src="${escapeHtml(track.url)}" aria-label="${escapeHtml(track.title)}"></audio>
      <div class="song-studio-time"><time data-reference-elapsed>0:00</time><time data-reference-duration>${formatTaskSongTime(duration)}</time></div>
      <div class="song-studio-wave"><svg viewBox="0 0 560 80" preserveAspectRatio="none" aria-hidden="true">${waveform}</svg><div class="song-studio-wave-progress"><svg viewBox="0 0 560 80" preserveAspectRatio="none" aria-hidden="true">${waveform}</svg></div><input type="range" min="0" max="${duration}" step="0.1" value="0" data-reference-seek aria-label="${escapeHtml(track.title)}播放进度" aria-valuetext="0:00 / ${formatTaskSongTime(duration)}"></div>
      <div class="song-studio-player-controls"><button type="button" data-reference-skip="-15" aria-label="后退十五秒" title="后退十五秒">${skipIcon()}</button><button type="button" class="song-studio-play" data-reference-play aria-label="播放 ${escapeHtml(track.title)}" data-audio-title="${escapeHtml(track.title)}"><span aria-hidden="true">▶</span></button><button type="button" data-reference-skip="15" aria-label="前进十五秒" title="前进十五秒">${skipIcon(true)}</button></div>
      <p class="song-studio-audio-error" role="status" hidden>音频暂时无法播放，请重试。</p>
    </div>`;
  }
  function render(task) {
    const locked = task.status !== 'in_progress', disabled = locked ? 'disabled' : '';
    const referenceAudio = referenceForTask(task), uploading = pendingUploads.has(task.id), referenceReady = Boolean(referenceAudio) && !uploading;
    const status = taskStatusMeta[task.status], results = task.candidates || [];
    const outputs = results.length ? results.map((candidate, index) => {
      const selected = candidate.id === task.selectedCandidateId;
      const saved = window.orchestraMaterialLibrary?.hasSaved(task, candidate) || false;
      return `<article class="song-studio-result${selected ? ' is-selected' : ''}" aria-label="${escapeHtml(candidate.title)}">
        <div class="song-studio-result-toolbar"><span class="song-studio-result-number">${index + 1}</span><strong class="song-studio-result-title" title="${escapeHtml(candidate.title)}">${escapeHtml(candidate.title)}</strong><div class="song-studio-result-actions" role="group" aria-label="${escapeHtml(candidate.title)}的操作">
          <a href="${escapeHtml(candidate.url)}" download="${escapeHtml(candidate.title)}.wav" aria-label="下载${escapeHtml(candidate.title)}" title="下载${escapeHtml(candidate.title)}（演示音频）">${transferIcon(true)}<span>下载</span></a>
          <button type="button" class="song-studio-save-material${saved ? ' is-saved' : ''}" data-save-song-material="${escapeHtml(candidate.id)}" aria-label="${escapeHtml(candidate.title)}${saved ? '已保存至素材库' : '保存素材'}" title="${saved ? '已保存至素材库，可在「素材」查看' : '选择素材库及文件夹后保存'}" ${saved ? 'disabled' : ''}>${saved ? '✓ 已保存' : '保存素材'}</button>
        </div><button type="button" data-task-candidate="${escapeHtml(candidate.id)}" aria-pressed="${selected}" ${disabled}>✓ ${selected ? '已设为输出' : '设为输出'}</button></div>
        <div class="song-studio-result-body">${player(candidate, false, index + 1)}</div></article>`;
    }).join('') : '<div class="ref-output-empty"><i>♫</i><b>暂无生成歌曲</b><small>确认左侧输入后，点击“开始运行”。</small></div>';
    return `<div class="reference-song-studio ref-song-workbench">
      <header class="song-studio-header ref-workbench-header"><div class="ref-workbench-meta"><i class="song-studio-node-icon" aria-hidden="true">♫</i><h2>基于参考生成歌曲</h2></div><span class="task-status ${status.className}">• ${status.label}</span></header>
      <div class="song-studio-columns">
        <section class="song-studio-panel song-studio-input" aria-labelledby="referenceSongInputTitle"><header><h3 id="referenceSongInputTitle">输入</h3></header><div class="song-studio-scroll">
          <div class="song-studio-field"><div class="song-studio-reference-heading"><div class="song-studio-label">参考歌曲 <em>必填</em>${info('上传一首参考歌曲，试听确认后再运行生成。')}</div>${!locked ? `<div class="song-studio-reference-actions"><button type="button" data-reference-upload ${uploading ? 'disabled' : ''}>${uploading ? '正在读取…' : `${transferIcon()}<span>上传音频</span>`}</button>${referenceAudio ? `<button type="button" class="song-studio-reference-delete" data-reference-delete ${uploading ? 'disabled' : ''}>删除</button>` : ''}</div><input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" data-reference-upload-input aria-label="上传参考歌曲" hidden>` : ''}</div>${referenceAudio ? player(referenceAudio, true) : `<div class="song-studio-reference-empty"><span aria-hidden="true">♫</span><b>暂无参考歌曲</b>${!locked ? `<button type="button" data-reference-upload ${uploading ? 'disabled' : ''}>${uploading ? '正在读取音频…' : `${transferIcon()}<span>上传音频</span>`}</button><small>选择本地音频，上传后可试听</small>` : ''}</div>`}${!locked ? '<p class="song-studio-reference-hint">更换或删除参考歌曲后，需要重新运行。上传音频用于本次页面演示。</p>' : ''}</div>
          <label class="song-studio-field task-form-field"><span class="song-studio-label">歌词 ${info('可填写用于生成歌曲的歌词。')}</span><textarea class="song-studio-lyrics" data-task-field="lyrics" ${disabled} placeholder="请输入歌词">${taskFormValue(task, 'lyrics', lyrics)}</textarea></label>
          <label class="song-studio-field task-form-field"><span class="song-studio-label">提示词 ${info('选填音乐风格、编曲、演唱和情绪方向。')}</span><input data-task-field="prompt" ${disabled} value="${taskFormValue(task, 'prompt')}" placeholder="选填音乐风格、编曲、演唱和情绪方向"></label>
          <label class="song-studio-field task-form-field"><span class="song-studio-label">标题</span><input data-task-field="title" ${disabled} value="${taskFormValue(task, 'title')}" placeholder="选填歌曲标题"></label>
        </div></section>
        <section class="song-studio-panel song-studio-output" aria-labelledby="referenceSongOutputTitle"><header><h3 id="referenceSongOutputTitle">输出</h3></header><div class="song-studio-scroll"><div class="song-studio-label">生成歌曲 ${info('试听后将一个版本设为输出，再确认提交。此处为本地交互演示音频。')}</div><div class="song-studio-results">${outputs}</div></div>
          ${!locked ? `<footer class="song-studio-actions"><button class="task-return-button" type="button" data-task-action="return">打回</button><button class="song-studio-run" type="button" data-task-generate="song" ${referenceReady ? '' : 'disabled'}>▶ ${results.length ? '再次运行' : '开始运行'}</button><button class="task-complete-button" type="button" data-task-action="complete" ${referenceReady && taskNodeCanComplete(task) ? '' : 'disabled'}>确认提交</button></footer>` : ''}
        </section>
      </div>
    </div>`;
  }
  function updatePlayer(audio) {
    const root = audio.closest('[data-reference-player]');
    if (!root) return;
    const seek = root.querySelector('[data-reference-seek]');
    const duration = Number.isFinite(audio.duration) ? audio.duration : Number(seek.max);
    const elapsed = Math.min(audio.currentTime || 0, duration);
    seek.max = duration; seek.value = elapsed;
    seek.setAttribute('aria-valuetext', `${formatTaskSongTime(elapsed)} / ${formatTaskSongTime(duration)}`);
    root.querySelector('[data-reference-elapsed]').textContent = formatTaskSongTime(elapsed);
    root.querySelector('[data-reference-duration]').textContent = formatTaskSongTime(duration);
    root.style.setProperty('--audio-progress', `${duration ? elapsed / duration * 100 : 0}%`);
    const button = root.querySelector('[data-reference-play]');
    button.setAttribute('aria-label', `${audio.paused ? '播放' : '暂停'} ${button.dataset.audioTitle}`);
    button.querySelector('span').textContent = audio.paused ? '▶' : '❚❚';
    root.classList.toggle('is-playing', !audio.paused);
  }
  function stopAudio(reset = true) {
    taskDetailPanel.querySelectorAll('[data-reference-player] audio').forEach(audio => {
      audio.pause(); if (reset) audio.currentTime = 0; updatePlayer(audio);
    });
  }
  function setReferenceAudio(task, track) {
    if (!task || task.status !== 'in_progress' || !task.referenceSongDemo) return false;
    if (task.id === selectedTaskId) saveTaskPageValues(task);
    const before = { ...task }, previousTrack = uploadedReferences.get(task.id);
    const changes = { referenceAudio: track ? { id: track.id, title: track.title, bytes: track.bytes, format: track.format, durationSeconds: track.durationSeconds } : null, candidates: [], selectedCandidateId: '', selectedCandidateText: '', selectedOutput: null, generationStage: 'ready', updatedAt: Date.now(), updatedLabel: '刚刚' };
    Object.assign(task, changes);
    if (!persistProductionTasks()) {
      for (const key of Object.keys(changes)) { if (Object.prototype.hasOwnProperty.call(before, key)) task[key] = before[key]; else delete task[key]; }
      showToast('参考歌曲保存失败，请重试', 'error'); return false;
    }
    if (task.id === selectedTaskId) stopAudio();
    if (track) uploadedReferences.set(task.id, track); else uploadedReferences.delete(task.id);
    if (previousTrack) URL.revokeObjectURL(previousTrack.url);
    if (task.id === selectedTaskId) renderTaskCenter();
    return true;
  }
  function readAudioDuration(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const finish = (error, duration) => {
        clearTimeout(timeout); audio.onloadedmetadata = null; audio.onerror = null;
        audio.removeAttribute('src'); audio.load();
        if (error) reject(error); else resolve(duration);
      };
      const timeout = setTimeout(() => finish(new Error('音频读取超时，请重新选择文件')), 15000);
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => Number.isFinite(audio.duration) && audio.duration > 0 ? finish(null, audio.duration) : finish(new Error('无法读取音频时长，请更换文件'));
      audio.onerror = () => finish(new Error('无法播放该音频，请上传有效的音频文件'));
      audio.src = url;
    });
  }
  async function uploadReferenceAudio(task, file) {
    if (!file || !task?.referenceSongDemo || task.status !== 'in_progress' || pendingUploads.has(task.id)) return;
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|aac|ogg|flac|opus|webm|aiff?)$/i.test(file.name)) { showToast('请选择音频文件', 'error'); return; }
    if (!file.size) { showToast('音频文件为空，请重新选择', 'error'); return; }
    if (task.id === selectedTaskId) saveTaskPageValues(task);
    const uploadId = crypto.randomUUID(); pendingUploads.set(task.id, uploadId);
    let url, retained = false;
    if (task.id === selectedTaskId) renderTaskCenter();
    try {
      url = URL.createObjectURL(file);
      const durationSeconds = await readAudioDuration(url);
      if (pendingUploads.get(task.id) !== uploadId || task.status !== 'in_progress' || !productionTasks.includes(task)) return;
      pendingUploads.delete(task.id);
      const extension = file.name.match(/\.([a-z0-9]+)$/i)?.[1];
      retained = setReferenceAudio(task, { id: uploadId, title: file.name, bytes: file.size, format: (extension || file.type.split('/')[1] || '音频').toUpperCase(), durationSeconds, url });
      if (retained) showToast('参考歌曲已上传，请重新运行生成歌曲');
    } catch (error) { showToast(error.message || '音频上传失败，请重试', 'error'); }
    finally {
      if (pendingUploads.get(task.id) === uploadId) pendingUploads.delete(task.id);
      if (url && !retained) URL.revokeObjectURL(url);
      if (task.id === selectedTaskId) renderTaskCenter();
    }
  }
  taskDetailPanel.addEventListener('click', async event => {
    const button = event.target.closest('[data-save-song-material]');
    if (!button || button.disabled) return;
    const task = productionTasks.find(item => item.id === selectedTaskId);
    const candidate = task?.candidates?.find(item => item.id === button.dataset.saveSongMaterial);
    if (!candidate) return;
    if (!window.orchestraMaterialLibrary) { showToast('素材库暂时不可用，请刷新后重试', 'error'); return; }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    let saved = false;
    try {
      saved = await window.orchestraMaterialLibrary.save(task, candidate);
    } finally {
      button.removeAttribute('aria-busy');
      button.disabled = saved;
    }
    if (saved) {
      button.classList.add('is-saved');
      button.textContent = '✓ 已保存';
      button.title = '已保存至素材库，可在「素材」查看';
      button.setAttribute('aria-label', `${candidate.title}已保存至素材库`);
    }
  });
  taskDetailPanel.addEventListener('click', event => {
    const control = event.target.closest('[data-reference-upload],[data-reference-delete]');
    if (!control) return;
    const task = productionTasks.find(item => item.id === selectedTaskId);
    if (!task?.referenceSongDemo || task.status !== 'in_progress' || pendingUploads.has(task.id)) return;
    if (control.hasAttribute('data-reference-upload')) { taskDetailPanel.querySelector('[data-reference-upload-input]')?.click(); return; }
    if (setReferenceAudio(task, null)) showToast('参考歌曲已删除，请重新上传');
  });
  taskDetailPanel.addEventListener('change', event => {
    if (!event.target.matches('[data-reference-upload-input]')) return;
    const file = event.target.files?.[0]; event.target.value = '';
    const task = productionTasks.find(item => item.id === selectedTaskId);
    uploadReferenceAudio(task, file);
  });
  taskDetailPanel.addEventListener('click', async event => {
    const button = event.target.closest('[data-reference-play],[data-reference-skip]');
    if (!button) return;
    const root = button.closest('[data-reference-player]'), audio = root.querySelector('audio');
    if (button.hasAttribute('data-reference-skip')) {
      audio.currentTime = Math.max(0, Math.min(Number.isFinite(audio.duration) ? audio.duration : Number(root.querySelector('[data-reference-seek]').max), audio.currentTime + Number(button.dataset.referenceSkip)));
      updatePlayer(audio); return;
    }
    if (!audio.paused) { audio.pause(); return; }
    taskDetailPanel.querySelectorAll('[data-reference-player] audio').forEach(other => { if (other !== audio) other.pause(); });
    root.querySelector('.song-studio-audio-error').hidden = true;
    if (audio.ended) audio.currentTime = 0;
    try { await audio.play(); if (!audio.isConnected) audio.pause(); }
    catch { root.querySelector('.song-studio-audio-error').hidden = false; }
  });
  taskDetailPanel.addEventListener('input', event => {
    if (!event.target.matches('[data-reference-seek]')) return;
    const audio = event.target.closest('[data-reference-player]').querySelector('audio');
    audio.currentTime = Number(event.target.value); updatePlayer(audio);
  });
  for (const type of ['loadedmetadata', 'timeupdate', 'play', 'pause', 'ended']) taskDetailPanel.addEventListener(type, event => {
    if (event.target.matches('[data-reference-player] audio')) updatePlayer(event.target);
  }, true);
  window.orchestraReferenceSongTask = { render, candidates, lyrics, stopAudio, validateReference };
})();
