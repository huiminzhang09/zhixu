/* Shared audio source chooser for task reference inputs. */
(() => {
  const team = () => document.querySelector('.workspace-option.active')?.dataset.workspaceId || 'orchestra-studio';
  const account = () => localStorage.getItem('orchestra-demo-account') || 'demo-user';
  const keyFor = record => JSON.stringify([record.sourceLibrary, record.id]);
  const validAudio = file => Boolean(file?.size) && (file.type?.startsWith('audio/') || ((!file.type || file.type === 'video/mp4') && /\.(mp3|wav|m4a|aac|ogg|flac|opus|webm|aiff?)$/i.test(file.name || '')));
  function checkCount(count, max, replacing = false) {
    if (!count) throw new Error('请至少选择 1 个音频文件');
    if (count > max) throw new Error(replacing ? '每次只能选择 1 个音频进行替换' : `本次最多可添加 ${max} 个音频，请重新选择`);
  }
  function open({ max = 1, replacing = false, isCurrent = () => true } = {}) {
    if (max < 1) { showToast('参考歌曲最多 4 个，已达上限，可替换现有音频', 'error'); return Promise.resolve(null); }
    const origin = { team: team(), account: account() }, trigger = document.activeElement;
    const current = () => isCurrent() && team() === origin.team && account() === origin.account;
    const catalog = () => {
      if (!current()) throw new Error('当前任务、账号或团队已变更，请重新选择');
      if (!window.orchestraMaterialLibrary?.listForComposition) throw new Error('素材库暂时不可用，请稍后重试');
      return window.orchestraMaterialLibrary.listForComposition(origin.team).filter(record => record.type === 'audio');
    };
    return new Promise(resolve => {
      const dialog = document.createElement('dialog'); dialog.className = 'task-audio-picker';
      dialog.setAttribute('aria-labelledby', 'taskAudioPickerTitle');
      dialog.innerHTML = `<form><header><div><h2 id="taskAudioPickerTitle">${replacing ? '替换参考歌曲' : '上传参考歌曲'}</h2><p>${replacing ? '选择 1 个音频替换当前歌曲' : `本次可添加 1～${max} 个音频`}</p></div><button type="button" data-audio-cancel aria-label="关闭">×</button></header>
        <div class="task-audio-picker-tabs" role="tablist" aria-label="音频来源"><button type="button" role="tab" aria-selected="true" aria-controls="taskAudioMaterialPanel" id="taskAudioMaterialTab" data-audio-source="library">素材库</button><button type="button" role="tab" aria-selected="false" aria-controls="taskAudioLocalPanel" id="taskAudioLocalTab" data-audio-source="local">本地上传</button></div>
        <div class="task-audio-picker-body"><section id="taskAudioMaterialPanel" role="tabpanel" aria-labelledby="taskAudioMaterialTab"><div class="task-audio-picker-filters"><select aria-label="选择素材库" name="library"><option value="personal">个人素材</option><option value="team">团队素材</option></select><input type="search" name="search" placeholder="搜索音频名称或文件夹" aria-label="搜索音频"></div><div class="task-audio-picker-list"></div></section>
        <section id="taskAudioLocalPanel" role="tabpanel" aria-labelledby="taskAudioLocalTab" hidden><label class="task-audio-upload-zone"><span aria-hidden="true">↑</span><b>选择本地音频文件</b><small>支持 MP3、WAV、M4A、AAC、OGG、FLAC 等音频</small><input type="file" name="files" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.webm,.aiff" ${max > 1 ? 'multiple' : ''}></label><div class="task-audio-local-files"></div></section>
        <p class="task-audio-picker-error" role="alert" hidden></p></div><footer><span data-audio-picked-count aria-live="polite">已选择 0 / ${max} 个</span><div><button type="button" class="secondary-button" data-audio-cancel>取消</button><button type="submit" class="primary-button" disabled>${replacing ? '确认替换' : '确认添加'}</button></div></footer></form>`;
      document.body.append(dialog);
      const form = dialog.querySelector('form'), list = dialog.querySelector('.task-audio-picker-list'), error = dialog.querySelector('.task-audio-picker-error');
      const submit = form.querySelector('[type="submit"]'), count = dialog.querySelector('[data-audio-picked-count]');
      const chosen = new Map(), urls = new Set(); let files = [], source = 'library', results = [], answer = null, disposed = false;
      function showError(message) { error.textContent = message; error.hidden = !message; }
      function releasePreviews() { list.querySelectorAll('audio').forEach(audio => audio.pause()); urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); }
      function updateCount() { const size = source === 'library' ? chosen.size : files.length; count.textContent = `已选择 ${size} / ${max} 个`; submit.disabled = !size || size > max; }
      function renderList() {
        releasePreviews();
        try {
          const query = form.elements.search.value.trim().toLocaleLowerCase();
          results = catalog().filter(record => record.sourceLibrary === form.elements.library.value && (!query || `${record.title} ${record.folderPath}`.toLocaleLowerCase().includes(query)));
          list.innerHTML = results.map((record, index) => `<article><label><input type="${max === 1 ? 'radio' : 'checkbox'}" name="audioChoice" data-audio-choice="${index}" ${chosen.has(keyFor(record)) ? 'checked' : ''}><span><b>${escapeHtml(record.title)}</b><small>${escapeHtml(record.folderPath)}</small></span></label><button type="button" data-audio-preview="${index}">试听</button><div data-audio-preview-player="${index}"></div></article>`).join('') || '<p class="task-audio-picker-empty">暂无匹配的音频，可切换素材库或使用本地上传。</p>';
        } catch (err) { list.innerHTML = ''; showError(err.message); }
        updateCount();
      }
      function setSource(next) {
        source = next; showError(''); releasePreviews();
        dialog.querySelectorAll('[data-audio-source]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.audioSource === source)));
        dialog.querySelector('#taskAudioMaterialPanel').hidden = source !== 'library';
        dialog.querySelector('#taskAudioLocalPanel').hidden = source !== 'local';
        if (source === 'library') renderList(); else updateCount();
      }
      dialog.querySelectorAll('[data-audio-source]').forEach(button => button.addEventListener('click', () => setSource(button.dataset.audioSource)));
      dialog.querySelector('.task-audio-picker-tabs').addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault(); setSource(source === 'library' ? 'local' : 'library'); dialog.querySelector(`[data-audio-source="${source}"]`).focus();
      });
      form.elements.library.addEventListener('change', renderList); form.elements.search.addEventListener('input', renderList);
      list.addEventListener('change', event => {
        const input = event.target.closest('[data-audio-choice]'); if (!input) return;
        const record = results[Number(input.dataset.audioChoice)]; if (!record) return;
        const key = keyFor(record); showError('');
        if (input.checked) {
          if (max === 1) chosen.clear();
          else if (chosen.size >= max) { input.checked = false; showError(`最多可再选择 ${max} 个音频，参考歌曲总数不能超过 4 个`); return; }
          chosen.set(key, record);
        } else chosen.delete(key);
        updateCount();
      });
      list.addEventListener('click', async event => {
        const button = event.target.closest('[data-audio-preview]'); if (!button || button.disabled) return;
        const record = results[Number(button.dataset.audioPreview)], holder = button.parentElement.querySelector('[data-audio-preview-player]');
        button.disabled = true;
        try {
          const latest = catalog().find(item => keyFor(item) === keyFor(record)); if (!latest) throw new Error('该音频已移除，请重新选择');
          const blob = await window.orchestraMaterialLibrary.readBlob(latest);
          if (disposed || !current() || !button.isConnected) return;
          if (!blob?.size) throw new Error('音频文件无法读取，请选择其他文件');
          const url = URL.createObjectURL(blob); urls.add(url);
          holder.innerHTML = `<audio controls preload="metadata" src="${escapeHtml(url)}" aria-label="试听 ${escapeHtml(record.title)}"></audio>`;
        } catch (err) { if (!disposed) showError(err.message); }
        finally { button.disabled = false; }
      });
      list.addEventListener('play', event => list.querySelectorAll('audio').forEach(audio => { if (audio !== event.target) audio.pause(); }), true);
      form.elements.files.addEventListener('change', () => {
        showError('');
        try {
          const selected = [...form.elements.files.files]; if (!selected.length) return;
          checkCount(selected.length, max, replacing);
          if (selected.some(file => !validAudio(file))) throw new Error('请选择有效且非空的音频文件');
          files = selected;
          dialog.querySelector('.task-audio-local-files').innerHTML = files.map(file => `<div><span>♫ ${escapeHtml(file.name)}</span><small>${(file.size / 1048576).toFixed(2)} MB</small></div>`).join('');
        } catch (err) { showError(err.message); }
        form.elements.files.value = ''; updateCount();
      });
      form.addEventListener('submit', event => {
        event.preventDefault(); showError('');
        try {
          if (!current()) throw new Error('当前任务、账号或团队已变更，请重新选择');
          const sources = source === 'local' ? files.map(file => ({ kind: 'file', file })) : [...chosen.keys()].map(key => {
            const latest = catalog().find(record => keyFor(record) === key); if (!latest) throw new Error('所选音频已移除，请重新选择');
            return { kind: 'material', record: latest };
          });
          checkCount(sources.length, max, replacing); answer = sources; dialog.close();
        } catch (err) { showError(err.message); }
      });
      dialog.querySelectorAll('[data-audio-cancel]').forEach(button => button.addEventListener('click', () => dialog.close()));
      dialog.addEventListener('close', () => { disposed = true; releasePreviews(); dialog.remove(); if (trigger?.isConnected) trigger.focus(); resolve(answer); }, { once: true });
      renderList(); dialog.showModal();
    });
  }
  window.orchestraTaskAudioPicker = { open, validAudio, checkCount };
})();
