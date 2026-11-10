/* Creation form shared by the audio library's Persona workflow. */
(() => {
  const phaseLabels = {
    'song-generating': '歌曲生成中',
    'song-failed': '歌曲生成失败',
    confirming: '待确认',
    generating: '音色生成中',
    succeeded: '生成成功',
    failed: '音色生成失败'
  };
  const exampleEmptyMessages = {
    draft: '歌曲生成后会在这里显示候选结果。',
    'song-generating': '正在生成歌曲，暂无候选结果。',
    'song-failed': '本次歌曲生成未获得候选结果。',
    confirming: '暂无可试听的候选歌曲。',
    generating: '正在使用选中的歌曲生成音色。',
    succeeded: '暂无可试听的音色。',
    failed: '本次音色生成未完成。'
  };

  function open({ isCurrent, chooseReference, generate, submitPersona, initialDraft, saveDraft, onClose, example }) {
    const existing = document.querySelector('.timbre-creation[open]');
    if (existing) return existing;

    const trigger = document.activeElement;
    const readOnly = Boolean(example);
    const canRetry = example?.status === 'failed' && typeof example.onRetry === 'function';
    const dialog = document.createElement('dialog');
    dialog.className = 'material-dialog timbre-creation';
    if (readOnly) dialog.classList.add('is-example');
    dialog.setAttribute('aria-labelledby', 'timbreCreationTitle');
    dialog.innerHTML = `<form>
      <header>
        <div>
          <div class="timbre-creation-heading">
            <h2 id="timbreCreationTitle">创建音色</h2>
            <span class="timbre-creation-phase" data-creation-phase hidden></span>
          </div>
          <p class="material-dialog-hint" data-creation-intro>填写音色信息，生成歌曲后选择一个输出创建音色。</p>
        </div>
        <button type="button" data-creation-close aria-label="关闭创建音色">×</button>
      </header>
      <div class="timbre-creation-body">
        <fieldset class="timbre-creation-metadata">
          <legend>音色信息</legend>
          <div class="timbre-creation-metadata-fields">
            <div>
              <label for="timbreCreationName">音色名称 <span aria-hidden="true">*</span></label>
              <input name="personaName" id="timbreCreationName" type="text" maxlength="50" placeholder="输入音色名称，最多 50 字" autocomplete="off" required>
            </div>
            <div>
              <label for="timbreCreationStyle">风格描述 <span aria-hidden="true">*</span></label>
              <textarea name="personaStyle" id="timbreCreationStyle" maxlength="200" placeholder="描述音色、演唱方式或适用风格，最多 200 字" rows="2" required></textarea>
            </div>
          </div>
        </fieldset>
        <fieldset class="timbre-creation-settings">
          <legend>配置</legend>
          <div class="timbre-creation-reference">
            <div class="timbre-creation-reference-heading">
              <strong>参考音频 <span aria-hidden="true">*</span></strong>
              <button type="button" data-creation-reference>选择或上传音频</button>
            </div>
            <p data-creation-reference-title>支持从素材库选择，也可上传本地音频。</p>
            <audio data-creation-reference-player controls preload="metadata" aria-label="试听参考音频" hidden></audio>
          </div>
          <label for="timbreCreationLyrics">歌词 <span aria-hidden="true">*</span></label>
          <textarea name="lyrics" id="timbreCreationLyrics" placeholder="输入歌曲歌词" required rows="4"></textarea>
          <label for="timbreCreationPrompt">提示词 <span aria-hidden="true">*</span></label>
          <textarea name="prompt" id="timbreCreationPrompt" placeholder="描述曲风、演唱方式和声音特征" required rows="2"></textarea>
          <div class="timbre-creation-options">
            <label>模型版本
              <select name="model"><option value="hawk-v6">Hawk（V6）</option></select>
            </label>
            <fieldset class="timbre-creation-count">
              <legend>生成数量</legend>
              <label><input type="radio" name="count" value="2" checked>2</label>
              <label><input type="radio" name="count" value="4">4</label>
            </fieldset>
          </div>
          <details class="timbre-creation-advanced">
            <summary>更多配置</summary>
            <label>反向提示词
              <textarea name="negativePrompt" placeholder="描述希望避免的声音或风格" rows="2"></textarea>
            </label>
            <label>风格强度 <output for="timbreCreationStrength" data-creation-strength>50%</output>
              <input type="range" name="styleStrength" id="timbreCreationStrength" aria-valuetext="50%" min="0" max="1" step="0.1" value="0.5">
            </label>
            <label>随机度 <output for="timbreCreationRandomness" data-creation-randomness>50%</output>
              <input type="range" name="randomness" id="timbreCreationRandomness" aria-valuetext="50%" min="0" max="1" step="0.1" value="0.5">
            </label>
            <label>人声性别
              <select name="voiceGender">
                <option value="unspecified">不指定</option>
                <option value="female">女声</option>
                <option value="male">男声</option>
              </select>
            </label>
            <label>生成纯音乐
              <select name="instrumental" disabled><option value="no">否</option></select>
            </label>
            <label class="timbre-creation-check"><input type="checkbox" name="skipCopyrightCheck">跳过版权检查</label>
          </details>
          <button type="submit" formnovalidate class="timbre-creation-generate" data-creation-generate>生成歌曲</button>
        </fieldset>
        <section class="timbre-creation-results" aria-labelledby="timbreCreationResultsTitle">
          <h3 id="timbreCreationResultsTitle">生成结果</h3>
          <p class="material-dialog-hint">交互演示使用样例音频。</p>
          <p class="timbre-creation-empty" data-creation-empty>生成歌曲后，可在这里试听并选择一个输出。</p>
          <div data-creation-results role="radiogroup" aria-label="选择输出结果"></div>
          <p class="material-dialog-error timbre-creation-song-error" data-creation-song-error role="alert"></p>
        </section>
      </div>
      <div class="timbre-creation-feedback">
        <p class="material-dialog-error" data-creation-error role="alert"></p>
        <footer>
          <p class="material-dialog-hint" data-creation-status role="status"></p>
          <div>
            <button type="button" data-creation-close>关闭</button>
            <button type="button" class="material-primary" data-creation-persona disabled>创建音色</button>
          </div>
        </footer>
      </div>
    </form>`;

    const form = dialog.querySelector('form');
    const settings = dialog.querySelector('.timbre-creation-settings');
    const metadata = dialog.querySelector('.timbre-creation-metadata');
    const referenceButton = dialog.querySelector('[data-creation-reference]');
    const referenceAudio = dialog.querySelector('[data-creation-reference-player]');
    const referenceTitle = dialog.querySelector('[data-creation-reference-title]');
    const generateButton = dialog.querySelector('[data-creation-generate]');
    const personaButton = dialog.querySelector('[data-creation-persona]');
    const closeButtons = dialog.querySelectorAll('[data-creation-close]');
    const results = dialog.querySelector('[data-creation-results]');
    const empty = dialog.querySelector('[data-creation-empty]');
    const error = dialog.querySelector('[data-creation-error]');
    const songError = dialog.querySelector('[data-creation-song-error]');
    const status = dialog.querySelector('[data-creation-status]');
    const phaseBadge = dialog.querySelector('[data-creation-phase]');

    let reference = null, referenceURL = null, generatedConfig = null;
    let candidates = [], selectedId = null, operation = '';
    let draftStatus = initialDraft?.status === 'failed' ? 'song-failed' : initialDraft?.status || 'draft';
    const isOpen = () => dialog.open && dialog.isConnected;
    const selected = () => candidates.find(item => item.id === selectedId);

    function requireCurrent() {
      if (!isCurrent()) throw Error('当前账号、团队或音色库页面已变更，请重新打开创建音色');
    }

    function readMetadata() {
      return {
        name: form.elements.personaName.value.trim(),
        style: form.elements.personaStyle.value.trim()
      };
    }

    function updateControls() {
      const candidate = selected();
      const { name, style } = readMetadata();
      const metadataReady = Boolean(name && style);
      const busy = Boolean(operation);
      settings.disabled = readOnly || busy;
      metadata.disabled = readOnly || busy;
      const phase = example?.status || (operation === 'generating' ? 'song-generating' : draftStatus);
      phaseBadge.dataset.phase = phase;
      phaseBadge.textContent = phaseLabels[phase] || '';
      phaseBadge.hidden = !phaseBadge.textContent;
      const isGeneratingSong = phase === 'song-generating';
      generateButton.textContent = isGeneratingSong || candidates.length || phase === 'song-failed' ? '重新生成歌曲' : '生成歌曲';
      generateButton.disabled = isGeneratingSong;
      personaButton.disabled = busy || (readOnly ? !canRetry : !candidate || !metadataReady);
      personaButton.textContent = operation === 'submitting' ? '正在提交…' : canRetry ? '重新生成音色' : '创建音色';
      closeButtons.forEach(button => { button.disabled = operation === 'submitting'; });
      results.querySelectorAll('input').forEach(input => { input.disabled = readOnly || busy; });
      if (operation) dialog.setAttribute('aria-busy', 'true');
      else dialog.removeAttribute('aria-busy');

      const progress = { reference: '正在选择参考音频', generating: '正在生成歌曲结果', submitting: '正在提交，稍后可在音色库查看生成进度' };
      let nextStep = candidates.length ? '请选择一首歌曲作为输出。' : '生成歌曲后，选择一个输出以创建音色。';
      if (candidate) nextStep = metadataReady ? `已选择「${candidate.title}」，可创建音色。` : '请填写音色名称和风格描述。';
      if (phase === 'song-failed' && !candidate) nextStep = '歌曲生成失败，可重新生成';
      if (readOnly) nextStep = canRetry ? '可使用已选歌曲重新生成音色。' : '状态示例';
      status.textContent = progress[operation] || nextStep;
    }

    function showResults() {
      results.querySelectorAll('audio').forEach(audio => audio.pause());
      const playback = example?.audio;
      empty.hidden = Boolean(candidates.length || playback);
      if (playback) {
        const heading = example.status === 'succeeded' ? '生成的音色' : '选中的歌曲';
        const title = playback.title || heading;
        results.removeAttribute('role');
        results.removeAttribute('aria-label');
        results.innerHTML = `<article class="timbre-creation-result timbre-creation-example-result">
          <h4>${heading}</h4>
          <p>${escapeHtml(title)}</p>
          ${playback.url
            ? `<audio data-creation-example-audio src="${escapeHtml(playback.url)}" controls preload="metadata" aria-label="试听 ${escapeHtml(title)}"></audio>`
            : '<p class="material-dialog-hint">音频暂不可用。</p>'}
        </article>`;
        return;
      }
      results.innerHTML = candidates.map(item => `<article class="timbre-creation-result">
        <label><input type="radio" name="outputCandidate" value="${escapeHtml(item.id)}" ${item.id === selectedId ? 'checked' : ''}><span>${escapeHtml(item.title)}</span></label>
        <audio src="${escapeHtml(item.url)}" controls preload="metadata" aria-label="试听 ${escapeHtml(item.title)}"></audio>
      </article>`).join('');
    }

    function invalidateResults(message = '') {
      candidates = [];
      selectedId = null;
      generatedConfig = null;
      draftStatus = 'draft';
      songError.textContent = '';
      empty.textContent = message || '生成歌曲后，可在这里试听并选择一个输出。';
      showResults();
      updateControls();
    }

    function readConfig() {
      const fields = form.elements;
      return {
        reference,
        lyrics: fields.lyrics.value.trim(),
        prompt: fields.prompt.value.trim(),
        model: fields.model.value,
        count: Number(fields.count.value),
        negativePrompt: fields.negativePrompt.value.trim(),
        styleStrength: Number(fields.styleStrength.value),
        randomness: Number(fields.randomness.value),
        voiceGender: fields.voiceGender.value,
        instrumental: fields.instrumental.value,
        skipCopyrightCheck: fields.skipCopyrightCheck.checked
      };
    }

    function validateConfig(config) {
      if (!config.reference?.blob?.size) {
        referenceButton.focus();
        throw Error('请选择或上传参考音频');
      }
      if (!config.lyrics) {
        form.elements.lyrics.focus();
        throw Error('请填写歌词');
      }
      if (!config.prompt) {
        form.elements.prompt.focus();
        throw Error('请填写提示词');
      }
    }

    function persistDraft() {
      if (readOnly || !saveDraft) return;
      try {
        requireCurrent();
        saveDraft({ config: readConfig(), candidates, selectedId, ...readMetadata() });
      } catch (failure) {
        error.textContent = failure.message || '保存配置失败，请重试';
      }
    }

    function releaseReference() {
      referenceAudio.pause();
      referenceAudio.removeAttribute('src');
      if (referenceURL) URL.revokeObjectURL(referenceURL);
      referenceURL = null;
    }

    function showReference(source) {
      const url = source.blob?.size ? URL.createObjectURL(source.blob) : null;
      releaseReference();
      reference = source;
      referenceURL = url;
      const previewURL = url || (readOnly ? source.url : null);
      if (previewURL) referenceAudio.src = previewURL;
      referenceAudio.hidden = !previewURL;
      referenceTitle.textContent = source.title || '参考音频';
      referenceButton.textContent = '更换参考音频';
    }

    referenceButton.addEventListener('click', async () => {
      if (readOnly || operation) return;
      error.textContent = '';
      try {
        requireCurrent();
        operation = 'reference';
        updateControls();
        const source = await chooseReference();
        if (!isOpen() || !source) return;
        requireCurrent();
        if (!source.blob?.size) throw Error('参考音频无法读取，请重新选择');
        showReference(source);
        invalidateResults('参考音频已选择，请生成歌曲。');
        persistDraft();
      } catch (failure) {
        if (isOpen()) error.textContent = failure.message || '读取参考音频失败，请重试';
      } finally {
        if (isOpen()) {
          operation = '';
          updateControls();
          referenceButton.focus();
        }
      }
    });

    function updatePercentage(control, output) {
      const value = `${Math.round(Number(control.value) * 100)}%`;
      dialog.querySelector(output).textContent = value;
      control.setAttribute('aria-valuetext', value);
    }

    function settingsChanged(event) {
      if (readOnly || operation || !event.target.matches('input, textarea, select')) return;
      updatePercentage(form.elements.styleStrength, '[data-creation-strength]');
      updatePercentage(form.elements.randomness, '[data-creation-randomness]');
      error.textContent = '';
      if (generatedConfig || draftStatus === 'song-failed') invalidateResults('配置已修改，请重新生成歌曲。');
      persistDraft();
    }
    settings.addEventListener('input', settingsChanged);
    metadata.addEventListener('input', () => {
      if (readOnly || operation) return;
      error.textContent = '';
      updateControls();
      persistDraft();
    });
    results.addEventListener('change', event => {
      if (readOnly || event.target.name !== 'outputCandidate' || !event.target.checked || operation) return;
      selectedId = event.target.value;
      error.textContent = '';
      updateControls();
      persistDraft();
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (readOnly || operation) return;
      error.textContent = '';
      try {
        requireCurrent();
        const config = readConfig();
        validateConfig(config);
        operation = 'generating';
        invalidateResults('正在生成歌曲，请稍候…');
        const generated = await generate(config);
        if (!isOpen()) return;
        requireCurrent();
        if (!Array.isArray(generated) || generated.length !== config.count || generated.some(item => !item.id || !item.url)) {
          throw Error('生成结果不完整，请重新生成');
        }
        candidates = generated;
        generatedConfig = config;
        draftStatus = 'confirming';
        showResults();
      } catch (failure) {
        if (isOpen()) {
          if (operation === 'generating') {
            invalidateResults('歌曲未生成，请重新生成。');
            draftStatus = 'song-failed';
            songError.textContent = failure.message || '歌曲生成失败，请重试';
          } else {
            error.textContent = failure.message || '无法生成歌曲，请检查配置';
          }
        }
      } finally {
        if (isOpen()) {
          const completed = operation === 'generating' && candidates.length > 0;
          operation = '';
          updateControls();
          if (completed) results.querySelector('input')?.focus();
        }
      }
    });

    personaButton.addEventListener('click', async () => {
      const candidate = selected();
      const details = readMetadata();
      if (operation) return;
      if (readOnly ? !canRetry : !candidate || !generatedConfig || !details.name || !details.style) return;
      error.textContent = '';
      try {
        requireCurrent();
        operation = 'submitting';
        updateControls();
        if (readOnly) await example.onRetry();
        else await submitPersona(candidate, generatedConfig, details);
        if (isOpen()) dialog.close();
      } catch (failure) {
        if (isOpen()) error.textContent = failure.message || (readOnly ? '重新生成音色未提交，请重试' : '音色创建未提交，请重试');
      } finally {
        if (isOpen()) {
          operation = '';
          updateControls();
          personaButton.focus();
        }
      }
    });

    dialog.addEventListener('play', event => {
      document.querySelectorAll('audio').forEach(audio => { if (audio !== event.target) audio.pause(); });
    }, true);
    closeButtons.forEach(button => button.addEventListener('click', () => {
      if (operation !== 'submitting') dialog.close();
    }));
    dialog.addEventListener('cancel', event => {
      if (operation === 'submitting') event.preventDefault();
    });
    dialog.addEventListener('close', () => {
      releaseReference();
      results.querySelectorAll('audio').forEach(audio => audio.pause());
      dialog.remove();
      onClose?.();
      if (trigger?.isConnected) trigger.focus();
    }, { once: true });

    if (initialDraft) {
      const fields = form.elements;
      const config = initialDraft.config || {};
      for (const key of ['lyrics', 'prompt', 'model', 'count', 'negativePrompt', 'styleStrength', 'randomness', 'voiceGender']) {
        if (config[key] != null) fields[key].value = String(config[key]);
      }
      fields.skipCopyrightCheck.checked = Boolean(config.skipCopyrightCheck);
      fields.personaName.value = initialDraft.name || '';
      fields.personaStyle.value = initialDraft.style || '';
      if (config.reference) showReference(config.reference);
      updatePercentage(fields.styleStrength, '[data-creation-strength]');
      updatePercentage(fields.randomness, '[data-creation-randomness]');

      candidates = initialDraft.candidates || [];
      selectedId = initialDraft.selectedId || null;
      if (candidates.length) generatedConfig = readConfig();
      if (draftStatus === 'song-failed') empty.textContent = '歌曲未生成，请重新生成。';
    }
    if (readOnly) {
      referenceButton.hidden = true;
      generateButton.hidden = example.status !== 'song-generating';
      personaButton.hidden = !canRetry;
      dialog.querySelector('[data-creation-intro]').textContent = '查看音色创建流程的状态示例。';
      dialog.querySelectorAll('[placeholder]').forEach(field => { field.placeholder = '未填写'; });
      if (!reference) referenceTitle.textContent = '未选择参考音频。';
      empty.textContent = exampleEmptyMessages[example.status] || '暂无结果。';
    }
    const initialError = example?.error || initialDraft?.error || '';
    if ((example?.status || draftStatus) === 'song-failed') songError.textContent = initialError;
    else error.textContent = initialError;
    showResults();

    document.body.append(dialog);
    dialog.showModal();
    updateControls();
    const focusTarget = readOnly
      ? canRetry ? personaButton : closeButtons[0]
      : selected() ? form.elements.personaName : results.querySelector('input') || form.elements.personaName;
    focusTarget.focus();
    return dialog;
  }

  window.orchestraTimbreCreation = { open };
})();
