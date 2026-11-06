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
  const candidates = (fresh = false, count = 2) => [
    { id: 'reference-song-a', title: '晨间来信 · 版本一', summary: '温暖钢琴 · 演示音频', url: './assets/reference-song-result-a.wav', durationSeconds: 24 },
    { id: 'reference-song-b', title: '晨间来信 · 版本二', summary: '轻快旋律 · 演示音频', url: './assets/reference-song-result-b.wav', durationSeconds: 28 },
    { id: 'reference-song-c', title: '晨间来信 · 版本三', summary: '复用钢琴片段 · 演示音频', url: './assets/reference-song-result-a.wav', durationSeconds: 24 },
    { id: 'reference-song-d', title: '晨间来信 · 版本四', summary: '复用旋律片段 · 演示音频', url: './assets/reference-song-result-b.wav', durationSeconds: 28 }
  ].slice(0, Number(count) === 4 ? 4 : 2).map(candidate => fresh ? { ...candidate, generationId: crypto.randomUUID() } : candidate);
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
    const duration = Number(track.durationSeconds)||0;
    if(!withFile)return `<div class="song-studio-player is-output" data-reference-player><div class="song-studio-output-title" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</div><audio preload="metadata" src="${escapeHtml(track.url||'')}" aria-label="${escapeHtml(track.title)}"></audio><div class="song-studio-inline-player"><button type="button" class="song-studio-play" data-reference-play aria-label="播放 ${escapeHtml(track.title)}" data-audio-title="${escapeHtml(track.title)}" ${track.url?'':'disabled'}><span aria-hidden="true">${playIcon(true)}</span></button><time data-reference-elapsed>0:00</time><div class="song-studio-wave"><svg viewBox="0 0 560 80" preserveAspectRatio="none" aria-hidden="true">${waveform}</svg><div class="song-studio-wave-progress"><svg viewBox="0 0 560 80" preserveAspectRatio="none" aria-hidden="true">${waveform}</svg></div><input type="range" min="0" max="${duration}" step="0.1" value="0" data-reference-seek aria-label="${escapeHtml(track.title)}播放进度" aria-valuetext="0:00 / ${formatTaskSongTime(duration)}" ${track.url?'':'disabled'}></div><time data-reference-duration>${formatTaskSongTime(duration)}</time></div><p class="song-studio-audio-error" role="status" hidden>音频暂时无法播放，请重试。</p></div>`;
    return `<div class="song-studio-player${withFile ? ' is-reference' : ''}" data-reference-player>
      ${withFile ? `<div class="song-studio-file"><i>${icon}</i><div><b>${escapeHtml(track.title)}</b><small>${(track.bytes / 1048576).toFixed(2)} MB / ${escapeHtml(track.format)} · ${track.sourceLibrary ? ({ team: '团队素材库', personal: '个人素材库', workflow: '结果资源' }[track.sourceLibrary] || '素材库') : track.demo ? '演示音频' : '本地音频'}</small></div></div>` : ''}
      <audio preload="metadata" src="${escapeHtml(track.url)}" aria-label="${escapeHtml(track.title)}"></audio>
      <div class="song-studio-time"><time data-reference-elapsed>0:00</time><time data-reference-duration>${formatTaskSongTime(duration)}</time></div>
      <div class="song-studio-wave"><svg viewBox="0 0 560 80" preserveAspectRatio="none" aria-hidden="true">${waveform}</svg><div class="song-studio-wave-progress"><svg viewBox="0 0 560 80" preserveAspectRatio="none" aria-hidden="true">${waveform}</svg></div><input type="range" min="0" max="${duration}" step="0.1" value="0" data-reference-seek aria-label="${escapeHtml(track.title)}播放进度" aria-valuetext="0:00 / ${formatTaskSongTime(duration)}"></div>
      <div class="song-studio-player-controls"><button type="button" data-reference-skip="-15" aria-label="后退十五秒" title="后退十五秒">${skipIcon()}</button><button type="button" class="song-studio-play" data-reference-play aria-label="播放 ${escapeHtml(track.title)}" data-audio-title="${escapeHtml(track.title)}"><span aria-hidden="true">▶</span></button><button type="button" data-reference-skip="15" aria-label="前进十五秒" title="前进十五秒">${skipIcon(true)}</button></div>
      <p class="song-studio-audio-error" role="status" hidden>音频暂时无法播放，请重试。</p>
    </div>`;
  }
  function generationSettings(task, locked) {
    const values = task.formValues || {}, disabled = locked ? 'disabled' : '';
    const select = (field, label, options, fallback) => `<label class="song-studio-setting"><span>${label}</span><select data-task-field="${field}" ${disabled}>${options.map(([value, text]) => `<option value="${value}" ${String(values[field] ?? fallback) === value ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
    const slider = (field, label, hint) => {
      const raw = Number(values[field] ?? .5), value = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : .5;
      return `<label class="song-studio-setting"><span>${label} ${info(hint)}</span><span class="song-studio-slider"><input type="range" min="0" max="1" step="0.1" value="${value}" data-task-field="${field}" data-song-setting-range aria-label="${label}" ${disabled}><output>${value.toFixed(1)}</output></span></label>`;
    };
    return `<div class="song-studio-settings" aria-label="歌曲生成设置">
      ${select('model', '模型版本', [['hawk-v6', 'Hawk（V6）']], 'hawk-v6')}
      ${window.orchestraMaterialLibrary?.timbreSelectionMarkup(task, locked) || ''}
      <div class="song-studio-setting"><span id="songGenerationCountLabel">生成数量</span><div class="song-studio-count" role="group" aria-labelledby="songGenerationCountLabel">${[2, 4].map(count => `<label><input type="radio" name="songGenerationCount" data-task-field="count" value="${count}" ${(Number(values.count) === 4 ? 4 : 2) === count ? 'checked' : ''} ${disabled}><span>${count}</span></label>`).join('')}</div></div>
      ${slider('styleStrength', '风格强度', '数值越高，生成歌曲越贴近参考歌曲的风格。')}
      ${slider('randomness', '随机度', '数值越高，生成结果的变化越丰富。')}
      ${select('voiceGender', '人声性别', [['unspecified', '不指定'], ['female', '女声'], ['male', '男声']], 'unspecified')}
      ${select('instrumental', '生成纯音乐', [['unspecified', '不指定'], ['yes', '是'], ['no', '否']], 'unspecified')}
      <label class="song-studio-setting"><span>跳过版权检查</span><span class="song-studio-switch"><input type="checkbox" role="switch" aria-label="跳过版权检查" data-task-field="skipCopyrightCheck" ${String(values.skipCopyrightCheck) === 'true' ? 'checked' : ''} ${disabled}><i aria-hidden="true"></i></span></label>
    </div>`;
  }
  const downloadIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 6v8m-3-3 3 3 3-3M7 15v3h10v-3"/></svg>';
  const materialIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 9 4-9 4-9-4 9-4ZM5 10l-2 2 9 4 9-4-2-2M5 15l-2 2 9 4 9-4-2-2"/><path d="m7 9 9-4M7 14l9-4M7 19l9-4"/></svg>';
  const timbreIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11v4m4-8v12m4-9v6m4-2v5m4-7v3"/><path d="m17 2 1.3 3.7L22 7l-3.7 1.3L17 12l-1.3-3.7L12 7l3.7-1.3L17 2Z"/></svg>';
  const savedIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  const playIcon=paused=>paused?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4a1.5 1.5 0 0 1 2.2-1.3l9 5.9a1.6 1.6 0 0 1 0 2.8l-9 5.9A1.5 1.5 0 0 1 5 16z" fill="currentColor"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="3" width="4" height="14" rx="1" fill="currentColor"/><rect x="12" y="3" width="4" height="14" rx="1" fill="currentColor"/></svg>';
  const downloads=new Set();
  function prepareLegacyAudio(task){
    // Older built-in examples had a synthetic preview only. Give those known examples real demo files.
    let changed=false;
    for(const candidate of task.candidates||[]){
      const index=['song-a','song-b','song-c'].indexOf(candidate.id);
      if(index!==-1&&!candidate.url){Object.assign(candidate,{url:`./assets/reference-song-result-${index===1?'b':'a'}.wav`,durationSeconds:index===1?28:24});changed=true;}
    }
    if(changed)persistProductionTasks();
  }
  function audioFilename(candidate){
    const base=String(candidate.title||'生成歌曲').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[.\s]+$/g,'').trim()||'生成歌曲';
    const ext=String(candidate.url||'').split(/[?#]/)[0].match(/\.(wav|mp3|m4a|ogg|flac|aac)$/i)?.[1]?.toLowerCase()||'wav';
    return base.toLowerCase().endsWith('.'+ext)?base:`${base}.${ext}`;
  }
  function downloadAllButton(task){
    const busy=downloads.has(task.id);
    return `<button type="button" class="song-studio-download-all" data-song-download-all ${busy||!task.candidates?.length?'disabled':''} aria-busy="${busy}" title="下载本节点全部生成音频">${downloadIcon}<span>${busy?'正在打包…':'下载全部'}</span></button>`;
  }
  function renderResults(task){
    prepareLegacyAudio(task);
    const locked=task.status!=='in_progress',disabled=locked?'disabled':'',results=task.candidates||[];
    return results.length?results.map((candidate,index)=>{
      const selected=candidate.id===task.selectedCandidateId,backup=!selected&&(task.backupCandidateIds||[]).includes(candidate.id);
      const saved=window.orchestraMaterialLibrary?.hasSaved(task,candidate)||false;
      return `<article class="song-studio-result${selected?' is-selected':backup?' is-backup':''}" aria-label="${escapeHtml(candidate.title)}">
        <div class="song-studio-result-toolbar"><span class="song-studio-result-number">${index+1}</span><div class="song-studio-result-selection" role="group" aria-label="${escapeHtml(candidate.title)}的资源状态">
        <button type="button" data-task-candidate="${escapeHtml(candidate.id)}" aria-pressed="${selected}" title="${locked?'任务已完成，输出状态不可修改':'仅可选择一个输出版本'}" ${disabled}>${selected?'✓ ':''}设为输出</button><button type="button" data-task-backup="${escapeHtml(candidate.id)}" aria-pressed="${backup}" title="${locked?'任务已完成，备选状态不可修改':backup?'点击取消备选':'可选择多个备选版本'}" ${disabled}>${backup?'✓ ':''}设为备选</button></div>
        <div class="song-studio-result-actions" role="group" aria-label="${escapeHtml(candidate.title)}的操作"><a class="song-studio-icon-action" ${candidate.url?`href="${escapeHtml(candidate.url)}" download="${escapeHtml(audioFilename(candidate))}"`:'aria-disabled="true"'} aria-label="下载${escapeHtml(candidate.title)}" title="下载">${downloadIcon}</a><button type="button" class="song-studio-icon-action song-studio-save-material${saved?' is-saved':''}" data-save-song-material="${escapeHtml(candidate.id)}" aria-label="${escapeHtml(candidate.title)}${saved?'已保存至素材库':'保存素材'}" title="${saved?'已保存至素材库':'保存素材'}" ${saved||!candidate.url?'disabled':''}>${saved?savedIcon:materialIcon}</button><button type="button" class="song-studio-icon-action song-studio-generate-timbre" data-generate-timbre="${escapeHtml(candidate.id)}" title="生成音色" aria-label="为${escapeHtml(candidate.title)}生成音色" ${!candidate.url?'disabled':''}>${timbreIcon}</button></div></div>
        <div class="song-studio-result-body">${player(candidate,false,index+1)}</div></article>`;
    }).join(''):'<div class="ref-output-empty"><i>♫</i><b>暂无生成歌曲</b><small>确认左侧输入后，点击“开始运行”。</small></div>';
  }
  taskDetailPanel.addEventListener('click',event=>{
    const button=event.target.closest('[data-generate-timbre]');
    if(!button||button.disabled)return;
    const task=productionTasks.find(item=>item.id===selectedTaskId);
    const candidate=task?.candidates?.find(item=>item.id===button.dataset.generateTimbre);
    if(!candidate?.url)return;
    window.orchestraMaterialLibrary?.createTimbre(task,candidate);
  });
  async function buildAudioArchive(task){
    const tracks=(task.candidates||[]).map(candidate=>({...candidate}));
    if(!tracks.length)throw new Error('暂无可下载音频');
    const library=window.orchestraMaterialLibrary;
    if(!library?.readBlob||!library?.ensureZip)throw new Error('下载组件尚未就绪，请刷新后重试');
    const Zip=await library.ensureZip(),archive=new Zip(),names=new Set();
    for(const candidate of tracks){
      if(!candidate.url)throw new Error(`「${candidate.title}」暂无可下载音频`);
      let blob;try{blob=await library.readBlob({...candidate,type:'audio'});if(!blob?.size)throw new Error('empty');}catch{throw new Error(`无法读取「${candidate.title}」，请重试`);}
      const filename=audioFilename(candidate),dot=filename.lastIndexOf('.');let name=filename,index=2;
      while(names.has(name.toLowerCase()))name=`${filename.slice(0,dot)} (${index++})${filename.slice(dot)}`;
      names.add(name.toLowerCase());archive.file(name,new Uint8Array(await blob.arrayBuffer()));
    }
    return archive.generateAsync({type:'blob',compression:'STORE'});
  }
  taskDetailPanel.addEventListener('click',async event=>{
    const button=event.target.closest('[data-song-download-all]');if(!button||button.disabled)return;
    const task=productionTasks.find(item=>item.id===selectedTaskId);if(!task||downloads.has(task.id))return;
    downloads.add(task.id);button.disabled=true;button.setAttribute('aria-busy','true');button.querySelector('span').textContent='正在打包…';
    try{
      const blob=await buildAudioArchive(task),url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='生成歌曲.zip';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      showToast('全部音频已打包，已交由浏览器下载');
    }catch(error){showToast(error.message||'下载失败，请重试','error');}
    finally{downloads.delete(task.id);button.disabled=false;button.setAttribute('aria-busy','false');button.querySelector('span').textContent='下载全部';}
  });
  function render(task) {
    const locked = task.status !== 'in_progress', disabled = locked ? 'disabled' : '';
    const references = referencesForTask(task), uploading = pendingUploads.has(task.id), referenceReady = task.nodeType === 'aiSong' || (references.length >= 1 && references.length <= referenceLimit(task) && !uploading);
    const status = taskStatusMeta[task.status], results = task.candidates || [];
    const outputs = renderResults(task);
    return `<div class="reference-song-studio ref-song-workbench">
      <header class="song-studio-header ref-workbench-header"><div class="ref-workbench-meta"><i class="song-studio-node-icon" aria-hidden="true">${icon}</i><h2>${task.nodeType==='aiSong'?escapeHtml(task.nodeTitle||'AI生成歌曲'):isPlaylist(task)?'基于歌单生成歌曲':'基于参考生成歌曲'}</h2><span class="song-studio-state ${status.className}"><i aria-hidden="true">${task.status === 'completed' ? '✓' : task.status === 'in_progress' ? '◷' : '−'}</i>${status.label}</span></div><span class="task-status song-studio-status ${status.className}">• ${status.label}</span></header>
      <div class="song-studio-columns">
        <section class="song-studio-panel song-studio-input" aria-labelledby="referenceSongInputTitle"><header><h3 id="referenceSongInputTitle">输入</h3></header><div class="song-studio-scroll">
          ${task.nodeType==='aiSong'?'':referenceMarkup(task, locked, uploading)}
          <label class="song-studio-field task-form-field"><span class="song-studio-label">歌词 ${info('可填写用于生成歌曲的歌词。')}</span><textarea class="song-studio-lyrics" data-task-field="lyrics" ${disabled} placeholder="请输入歌词">${taskFormValue(task, 'lyrics', task.nodeType==='aiSong'?'':lyrics)}</textarea></label>
          ${task.workflowTextReferenceDemo && !locked ? '<p class="song-studio-reference-hint">引用示例：输入 @，切换「结果资源」，在「输出」「备选」中选择「晨间来信」歌词，正文会填入当前输入框。</p>' : ''}
          <label class="song-studio-field task-form-field"><span class="song-studio-label">提示词 ${info('选填音乐风格、编曲、演唱和情绪方向。')}</span><textarea rows="2" data-task-field="prompt" ${disabled} placeholder="选填音乐风格、编曲、演唱和情绪方向">${taskFormValue(task, 'prompt')}</textarea></label>
          <label class="song-studio-field task-form-field"><span class="song-studio-label">标题</span><input data-task-field="title" maxlength="100" ${disabled} value="${taskFormValue(task, 'title')}" placeholder="选填歌曲标题，最多 50 个字符"></label>
          <label class="song-studio-field task-form-field"><span class="song-studio-label">反向提示词</span><input data-task-field="negativePrompt" ${disabled} value="${taskFormValue(task, 'negativePrompt')}" placeholder="选填需要规避的声音或风格"></label>
          ${generationSettings(task, locked)}
        </div></section>
        <section class="song-studio-panel song-studio-output" aria-labelledby="referenceSongOutputTitle"><header><h3 id="referenceSongOutputTitle">输出</h3>${downloadAllButton(task)}</header><div class="song-studio-scroll"><div class="song-studio-label">生成歌曲 ${info('输出只能选择一个，备选可选择多个，二者不能重复。输出和备选均可在成品编辑中添加。此处为本地交互演示音频。')}</div><div class="song-studio-results">${outputs}</div>${!locked ? `<div data-output-run-slot><button class="song-studio-run" type="button" data-task-generate="song" ${referenceReady ? '' : 'disabled'}>▶ ${results.length ? '再次运行' : '开始运行'}</button></div>` : ''}</div>
          ${!locked ? `<footer class="song-studio-actions"><button class="task-return-button" type="button" data-task-action="return">打回</button><button class="task-complete-button" type="button" data-task-action="complete" ${referenceReady && taskNodeCanComplete(task) ? '' : 'disabled'}>确认提交</button></footer>` : ''}
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
    if(root.classList.contains('is-output'))button.querySelector('span').innerHTML=playIcon(audio.paused);else button.querySelector('span').textContent = audio.paused ? '▶' : '❚❚';
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
        const track = { id: crypto.randomUUID(), title: Array.from(record?.title || file.name || '参考音频').slice(0, 50).join(''), url, bytes: file.size, format: (file.type?.split('/')[1] || file.name?.split('.').pop() || '音频').toUpperCase(), ...(record ? { sourceLibrary: record.sourceLibrary, ...(source.kind === 'workflow' ? { sourceWorkflowResourceId: record.id, sourceRunId: record.runId, sourceNode: record.node } : { sourceMaterialId: record.id }) } : {}) };
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
      button.innerHTML = savedIcon;
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
    if (event.target.matches('[data-song-setting-range]')) {
      event.target.parentElement.querySelector('output').value = Number(event.target.value).toFixed(1);
      return;
    }
    if (!event.target.matches('[data-reference-seek]')) return;
    const audio = event.target.closest('[data-reference-player]').querySelector('audio');
    audio.currentTime = Number(event.target.value); updatePlayer(audio);
  });
  for (const type of ['loadedmetadata', 'timeupdate', 'play', 'pause', 'ended']) taskDetailPanel.addEventListener(type, event => {
    if (event.target.matches('[data-reference-player] audio')) updatePlayer(event.target);
  }, true);
  window.addEventListener('pagehide', () => { for (const tracks of uploadedReferences.values()) tracks.forEach(track => { if (track.url.startsWith('blob:')) URL.revokeObjectURL(track.url); }); uploadedReferences.clear(); });
  window.orchestraReferenceSongTask = { render, renderResults, downloadAllButton, candidates, lyrics, stopAudio, validateReference };
})();
