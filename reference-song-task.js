/* Reference-song task example, with local audio for interactive previews. */
(() => {
  const reference = { title: '晨间来信 · 参考歌曲.wav', url: './assets/reference-song-demo.wav', durationSeconds: 32, bytes: 1024044, format: 'WAV', demo: true };
  const uploadedReferences = new Map(), pendingUploads = new Map();
  const isPlaylist = task => task.nodeType === 'playlistSong';
  const referenceLimit = task => isPlaylist(task) ? 4 : 1;
  function referencesForTask(task) {
    const uploaded = uploadedReferences.get(task.id) || [];
    const saved = Array.isArray(task.referenceAudios) ? task.referenceAudios : Object.prototype.hasOwnProperty.call(task, 'referenceAudio') ? [task.referenceAudio].filter(Boolean) : null;
    if (saved) return saved.map(item => uploaded.find(track => track.id === item.id)).filter(Boolean);
    return isPlaylist(task) ? [] : [reference];
  }
  function validateReference(task) {
    if (pendingUploads.has(task.id)) { showToast('音频正在选择或读取，请稍候', 'error'); return false; }
    const count = referencesForTask(task).length;
    if (count >= 1 && count <= referenceLimit(task)) return true;
    showToast(isPlaylist(task) ? '请上传 1～4 个参考音频后再运行' : '请先上传参考歌曲', 'error');
    taskDetailPanel.querySelector('[data-reference-choose]')?.focus();
    return false;
  }
  function referenceMarkup(task, locked, uploading) {
    const tracks = referencesForTask(task), limit = referenceLimit(task), playlist = isPlaylist(task);
    const choose = (index, label) => `<button type="button" data-reference-choose="${index}" ${uploading ? 'disabled' : ''}>${label === '上传' ? transferIcon() : ''}<span>${label}</span></button>`;
    return `<div class="song-studio-field"><div class="song-studio-reference-heading"><div class="song-studio-label">参考歌曲 <em>必填</em>${playlist ? `<small>${tracks.length} / 4 个</small>` : ''}${info(playlist ? '选择 1～4 个音频，支持素材库、结果资源或本地上传。结果资源仅展示当前运行的输出与备选音频。' : '选择 1 个参考音频，支持素材库、结果资源或本地上传。')}</div>${!locked && tracks.length ? `<div class="song-studio-reference-actions">${choose(playlist ? -1 : 0, playlist ? '上传' : '替换')}</div>` : ''}</div>
      <div class="song-studio-reference-list">${tracks.map((track, index) => `<div class="song-studio-reference-item">${playlist ? `<div class="song-studio-reference-heading"><b>参考歌曲 ${index + 1}</b>${!locked ? `<div class="song-studio-reference-actions">${choose(index, '替换')}</div>` : ''}</div>` : ''}${player(track, true, index)}</div>`).join('') || `<div class="song-studio-reference-empty"><span aria-hidden="true">♫</span><b>暂无参考歌曲</b>${!locked ? choose(-1, '上传') : ''}<small>${playlist ? '请选择 1～4 个音频' : '请选择 1 个音频'}，支持素材库、结果资源或本地上传</small></div>`}</div>
      ${!locked ? `<p class="song-studio-reference-hint" role="status">${uploading ? '正在选择或读取音频…' : `${playlist ? '可上传 1～4 个参考音频。' : ''}替换或添加参考歌曲后，需要重新运行生成歌曲。`}</p>` : ''}</div>`;
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
      ${withFile ? `<div class="song-studio-file"><i>${icon}</i><div><b>${escapeHtml(track.title)}</b><small>${(track.bytes / 1048576).toFixed(2)} MB / ${escapeHtml(track.format)} · ${track.sourceLibrary ? ({ team: '团队素材', personal: '个人素材', workflow: '结果资源' }[track.sourceLibrary] || '素材库') : track.demo ? '演示音频' : '本地音频'}</small></div></div>` : ''}
      <audio preload="metadata" src="${escapeHtml(track.url)}" aria-label="${escapeHtml(track.title)}"></audio>
      <div class="song-studio-time"><time data-reference-elapsed>0:00</time><time data-reference-duration>${formatTaskSongTime(duration)}</time></div>
      <div class="song-studio-wave"><svg viewBox="0 0 560 80" preserveAspectRatio="none" aria-hidden="true">${waveform}</svg><div class="song-studio-wave-progress"><svg viewBox="0 0 560 80" preserveAspectRatio="none" aria-hidden="true">${waveform}</svg></div><input type="range" min="0" max="${duration}" step="0.1" value="0" data-reference-seek aria-label="${escapeHtml(track.title)}播放进度" aria-valuetext="0:00 / ${formatTaskSongTime(duration)}"></div>
      <div class="song-studio-player-controls"><button type="button" data-reference-skip="-15" aria-label="后退十五秒" title="后退十五秒">${skipIcon()}</button><button type="button" class="song-studio-play" data-reference-play aria-label="播放 ${escapeHtml(track.title)}" data-audio-title="${escapeHtml(track.title)}"><span aria-hidden="true">▶</span></button><button type="button" data-reference-skip="15" aria-label="前进十五秒" title="前进十五秒">${skipIcon(true)}</button></div>
      <p class="song-studio-audio-error" role="status" hidden>音频暂时无法播放，请重试。</p>
    </div>`;
  }
  function render(task) {
    const locked = task.status !== 'in_progress', disabled = locked ? 'disabled' : '';
    const references = referencesForTask(task), uploading = pendingUploads.has(task.id), referenceReady = references.length >= 1 && references.length <= referenceLimit(task) && !uploading;
    const status = taskStatusMeta[task.status], results = task.candidates || [];
    const outputs = results.length ? results.map((candidate, index) => {
      const selected = candidate.id === task.selectedCandidateId;
      const backup = !selected && Array.isArray(task.backupCandidateIds) && task.backupCandidateIds.includes(candidate.id);
      const saved = window.orchestraMaterialLibrary?.hasSaved(task, candidate) || false;
      return `<article class="song-studio-result${selected ? ' is-selected' : backup ? ' is-backup' : ''}" aria-label="${escapeHtml(candidate.title)}">
        <div class="song-studio-result-toolbar"><span class="song-studio-result-number">${index + 1}</span><strong class="song-studio-result-title" title="${escapeHtml(candidate.title)}">${escapeHtml(candidate.title)}</strong><div class="song-studio-result-actions" role="group" aria-label="${escapeHtml(candidate.title)}的操作">
          <button type="button" data-task-candidate="${escapeHtml(candidate.id)}" aria-pressed="${selected}" title="仅可选择一个输出版本" ${disabled}>${selected ? '✓ 已设为输出' : '设为输出'}</button>
          <button type="button" data-task-backup="${escapeHtml(candidate.id)}" aria-pressed="${backup}" title="${backup ? '点击取消备选' : '可选择多个备选版本'}" ${disabled}>${backup ? '✓ 已设为备选' : '设为备选'}</button>
          <a href="${escapeHtml(candidate.url)}" download="${escapeHtml(candidate.title)}.wav" aria-label="下载${escapeHtml(candidate.title)}" title="下载${escapeHtml(candidate.title)}（演示音频）">${transferIcon(true)}<span>下载</span></a>
          <button type="button" class="song-studio-save-material${saved ? ' is-saved' : ''}" data-save-song-material="${escapeHtml(candidate.id)}" aria-label="${escapeHtml(candidate.title)}${saved ? '已保存至素材库' : '保存素材'}" title="${saved ? '已保存至素材库，可在「素材库」查看' : '选择素材库及文件夹后保存'}" ${saved ? 'disabled' : ''}>${saved ? '✓ 已保存' : '保存素材'}</button>
        </div></div>
        <div class="song-studio-result-body">${player(candidate, false, index + 1)}</div></article>`;
    }).join('') : '<div class="ref-output-empty"><i>♫</i><b>暂无生成歌曲</b><small>确认左侧输入后，点击“开始运行”。</small></div>';
    return `<div class="reference-song-studio ref-song-workbench">
      <header class="song-studio-header ref-workbench-header"><div class="ref-workbench-meta"><i class="song-studio-node-icon" aria-hidden="true">♫</i><h2>${isPlaylist(task) ? '基于歌单生成歌曲' : '基于参考生成歌曲'}</h2></div><span class="task-status ${status.className}">• ${status.label}</span></header>
      <div class="song-studio-columns">
        <section class="song-studio-panel song-studio-input" aria-labelledby="referenceSongInputTitle"><header><h3 id="referenceSongInputTitle">输入</h3></header><div class="song-studio-scroll">
          ${referenceMarkup(task, locked, uploading)}
          <label class="song-studio-field task-form-field"><span class="song-studio-label">歌词 ${info('可填写用于生成歌曲的歌词。')}</span><textarea class="song-studio-lyrics" data-task-field="lyrics" ${disabled} placeholder="请输入歌词">${taskFormValue(task, 'lyrics', lyrics)}</textarea></label>
          ${task.workflowTextReferenceDemo && !locked ? '<p class="song-studio-reference-hint">引用示例：输入 @，切换「结果资源」，在「输出」「备选」中选择「晨间来信」歌词，正文会填入当前输入框。</p>' : ''}
          <label class="song-studio-field task-form-field"><span class="song-studio-label">提示词 ${info('选填音乐风格、编曲、演唱和情绪方向。')}</span><input data-task-field="prompt" ${disabled} value="${taskFormValue(task, 'prompt')}" placeholder="选填音乐风格、编曲、演唱和情绪方向"></label>
          <label class="song-studio-field task-form-field"><span class="song-studio-label">标题</span><input data-task-field="title" ${disabled} value="${taskFormValue(task, 'title')}" placeholder="选填歌曲标题"></label>
        </div></section>
        <section class="song-studio-panel song-studio-output" aria-labelledby="referenceSongOutputTitle"><header><h3 id="referenceSongOutputTitle">输出</h3></header><div class="song-studio-scroll"><div class="song-studio-label">生成歌曲 ${info('输出只能选择一个，备选可选择多个，二者不能重复。输出和备选均可在成品编辑中添加。此处为本地交互演示音频。')}</div><div class="song-studio-results">${outputs}</div></div>
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
  function setReferenceAudios(task, tracks) {
    if (!task || task.status !== 'in_progress' || !task.referenceSongDemo) return false;
    if (tracks.length < 1 || tracks.length > referenceLimit(task)) throw new Error(`参考音频数量需为 1～${referenceLimit(task)} 个`);
    const before = { ...task }, previous = uploadedReferences.get(task.id) || [];
    const metadata = tracks.map(({ url, ...track }) => track);
    const changes = { referenceAudios: metadata, referenceAudio: metadata[0], candidates: [], selectedCandidateId: '', backupCandidateIds: [], selectedCandidateText: '', selectedOutput: null, generationStage: 'ready', updatedAt: Date.now(), updatedLabel: '刚刚' };
    Object.assign(task, changes);
    if (!persistProductionTasks()) {
      for (const key of Object.keys(changes)) { if (Object.prototype.hasOwnProperty.call(before, key)) task[key] = before[key]; else delete task[key]; }
      throw new Error('参考歌曲保存失败，请重试');
    }
    if (task.id === selectedTaskId) stopAudio();
    uploadedReferences.set(task.id, tracks);
    previous.filter(track => !tracks.includes(track)).forEach(track => { if (track.url.startsWith('blob:')) URL.revokeObjectURL(track.url); });
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
  async function chooseReferenceAudio(task, replaceIndex = -1) {
    const picker = window.orchestraTaskAudioPicker;
    if (!task?.referenceSongDemo || task.status !== 'in_progress' || pendingUploads.has(task.id)) return;
    if (!picker) { showToast('音频选择暂时不可用，请刷新后重试', 'error'); return; }
    const oldTracks = referencesForTask(task), replacing = replaceIndex >= 0;
    if (replacing && !oldTracks[replaceIndex]) return;
    const max = replacing ? 1 : referenceLimit(task) - oldTracks.length;
    if (max < 1) { showToast('参考歌曲最多 4 个，已达上限，可替换现有音频', 'error'); return; }
    const team = () => document.querySelector('.workspace-option.active')?.dataset.workspaceId || 'orchestra-studio';
    const account = () => localStorage.getItem('orchestra-demo-account') || 'demo-user';
    const initialTeam = team(), initialAccount = account();
    const isCurrent = () => task.id === selectedTaskId && task.status === 'in_progress' && productionTasks.includes(task) && team() === initialTeam && account() === initialAccount;
    saveTaskPageValues(task);
    const operation = crypto.randomUUID(); pendingUploads.set(task.id, operation);
    const prepared = []; let retained = false;
    renderTaskCenter();
    try {
      const sources = await picker.open({ max, replacing, task, isCurrent });
      if (!sources || !isCurrent()) return;
      picker.checkCount(sources.length, max, replacing);
      for (const source of sources) {
        let file, record;
        if (source.kind === 'file') {
          file = source.file;
          if (!picker.validAudio(file)) throw new Error('请选择有效且非空的音频文件');
        } else if (source.kind === 'workflow') {
          record = picker.resolveWorkflowAudio(task, source.record);
          file = await window.orchestraMaterialLibrary.readBlob(record);
          if (!file?.size) throw new Error('无法读取该结果音频，请重新选择');
        } else {
          record = window.orchestraMaterialLibrary.listForComposition(initialTeam).find(item => item.type === 'audio' && item.id === source.record.id && item.sourceLibrary === source.record.sourceLibrary);
          if (!record) throw new Error('所选音频已移除，请重新选择');
          file = await window.orchestraMaterialLibrary.readBlob(record);
          if (!file?.size) throw new Error('无法读取该音频，请重新选择');
        }
        const url = URL.createObjectURL(file);
        const track = { id: crypto.randomUUID(), title: record?.title || file.name, url, bytes: file.size, format: (file.type?.split('/')[1] || file.name?.split('.').pop() || '音频').toUpperCase(), ...(record ? { sourceLibrary: record.sourceLibrary, ...(source.kind === 'workflow' ? { sourceWorkflowResourceId: record.id, sourceRunId: record.runId, sourceNode: record.node } : { sourceMaterialId: record.id }) } : {}) };
        prepared.push(track); track.durationSeconds = await readAudioDuration(url);
      }
      if (!isCurrent() || pendingUploads.get(task.id) !== operation) return;
      // Recheck library sources after async reads, before changing the reference or generated results.
      const materialSources = sources.filter(source => source.kind === 'material');
      if (materialSources.length) {
        const current = window.orchestraMaterialLibrary.listForComposition(initialTeam);
        if (materialSources.some(source => !current.some(record => record.type === 'audio' && record.id === source.record.id && record.sourceLibrary === source.record.sourceLibrary))) throw new Error('所选音频已移除，请重新选择');
      }
      sources.filter(source => source.kind === 'workflow').forEach(source => picker.resolveWorkflowAudio(task, source.record));
      const next = [...oldTracks];
      if (replacing) next.splice(replaceIndex, 1, prepared[0]); else next.push(...prepared);
      retained = setReferenceAudios(task, next);
      if (retained) showToast(replacing ? '参考歌曲已替换，请重新运行生成歌曲' : `已添加 ${prepared.length} 个参考音频，请运行生成歌曲`);
    } catch (error) { showToast(error.message || '音频读取失败，请重试', 'error'); }
    finally {
      if (!retained) prepared.forEach(track => URL.revokeObjectURL(track.url));
      if (pendingUploads.get(task.id) === operation) pendingUploads.delete(task.id);
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
      button.title = '已保存至素材库，可在「素材库」查看';
      button.setAttribute('aria-label', `${candidate.title}已保存至素材库`);
    }
  });
  taskDetailPanel.addEventListener('click', event => {
    const control = event.target.closest('[data-reference-choose]'); if (!control || control.disabled) return;
    const task = productionTasks.find(item => item.id === selectedTaskId);
    chooseReferenceAudio(task, Number(control.dataset.referenceChoose));
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
  window.addEventListener('pagehide', () => { for (const tracks of uploadedReferences.values()) tracks.forEach(track => { if (track.url.startsWith('blob:')) URL.revokeObjectURL(track.url); }); uploadedReferences.clear(); });
  window.orchestraReferenceSongTask = { render, candidates, lyrics, stopAudio, validateReference };
})();
