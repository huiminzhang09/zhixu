/* Creation form shared by the audio library's Persona workflow. */
(() => {
  function open({ isCurrent, chooseReference, generate, submitPersona }) {
    const existing = document.querySelector('.timbre-creation[open]');
    if (existing) return existing;

    const trigger = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'material-dialog timbre-creation';
    dialog.setAttribute('aria-labelledby', 'timbreCreationTitle');
    dialog.innerHTML = `<form>
      <header>
        <div>
          <h2 id="timbreCreationTitle">创建音色</h2>
          <p class="material-dialog-hint">先生成歌曲，再选择输出并填写音色信息。</p>
        </div>
        <button type="button" data-creation-close aria-label="关闭创建音色">×</button>
      </header>
      <div class="timbre-creation-body">
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
            <label>风格强度 <output for="timbreCreationStrength" data-creation-strength>0.5</output>
              <input type="range" name="styleStrength" id="timbreCreationStrength" min="0" max="1" step="0.1" value="0.5">
            </label>
            <label>随机度 <output for="timbreCreationRandomness" data-creation-randomness>0.5</output>
              <input type="range" name="randomness" id="timbreCreationRandomness" min="0" max="1" step="0.1" value="0.5">
            </label>
            <label class="timbre-creation-check"><input type="checkbox" name="instrumental" disabled>生成纯音乐 <small>创建音色需保留人声</small></label>
            <label class="timbre-creation-check"><input type="checkbox" name="skipCopyrightCheck">跳过版权检查</label>
          </details>
          <button type="submit" formnovalidate class="timbre-creation-generate" data-creation-generate>生成歌曲</button>
        </fieldset>
        <section class="timbre-creation-results" aria-labelledby="timbreCreationResultsTitle">
          <h3 id="timbreCreationResultsTitle">生成结果</h3>
          <p class="material-dialog-hint">交互演示使用样例音频。</p>
          <p class="timbre-creation-empty" data-creation-empty>生成歌曲后，可在这里试听并选择一个输出。</p>
          <div data-creation-results role="radiogroup" aria-label="选择输出结果"></div>
          <fieldset class="timbre-creation-metadata" hidden disabled>
            <legend>音色信息</legend>
            <label for="timbreCreationName">音色名称 <span aria-hidden="true">*</span></label>
            <input name="personaName" id="timbreCreationName" type="text" maxlength="50" placeholder="输入音色名称，最多 50 字" autocomplete="off" required>
            <label for="timbreCreationStyle">风格描述 <span aria-hidden="true">*</span></label>
            <textarea name="personaStyle" id="timbreCreationStyle" maxlength="200" placeholder="描述音色、演唱方式或适用风格，最多 200 字" rows="2" required></textarea>
          </fieldset>
        </section>
      </div>
      <div class="timbre-creation-feedback">
        <p class="material-dialog-error" data-creation-error role="alert"></p>
        <footer>
          <p class="material-dialog-hint" data-creation-status role="status"></p>
          <div>
            <button type="button" data-creation-close>取消</button>
            <button type="button" class="material-primary" data-creation-persona disabled>生成 Persona</button>
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
    const status = dialog.querySelector('[data-creation-status]');

    let reference = null, referenceURL = null, generatedConfig = null;
    let candidates = [], selectedId = null, operation = '';
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
      settings.disabled = Boolean(operation);
      metadata.hidden = !candidate;
      metadata.disabled = !candidate || Boolean(operation);
      generateButton.textContent = operation === 'generating' ? '正在生成歌曲…' : candidates.length ? '重新生成歌曲' : '生成歌曲';
      personaButton.disabled = Boolean(operation) || !candidate || !metadataReady;
      personaButton.textContent = operation === 'submitting' ? '正在提交…' : '生成 Persona';
      closeButtons.forEach(button => { button.disabled = operation === 'submitting'; });
      results.querySelectorAll('input').forEach(input => { input.disabled = Boolean(operation); });
      if (operation) dialog.setAttribute('aria-busy', 'true');
      else dialog.removeAttribute('aria-busy');

      const progress = { reference: '正在选择参考音频', generating: '正在生成歌曲结果', submitting: '正在提交 Persona' };
      let nextStep = '选择一个输出后填写音色信息';
      if (candidate) nextStep = metadataReady ? `已选输出：${candidate.title}` : '请填写音色名称和风格描述';
      status.textContent = progress[operation] || nextStep;
    }

    function showResults() {
      results.querySelectorAll('audio').forEach(audio => audio.pause());
      empty.hidden = Boolean(candidates.length);
      results.innerHTML = candidates.map(item => `<article class="timbre-creation-result">
        <label><input type="radio" name="outputCandidate" value="${escapeHtml(item.id)}"><span>${escapeHtml(item.title)}</span></label>
        <audio src="${escapeHtml(item.url)}" controls preload="metadata" aria-label="试听 ${escapeHtml(item.title)}"></audio>
      </article>`).join('');
    }

    function invalidateResults(message = '') {
      candidates = [];
      selectedId = null;
      generatedConfig = null;
      empty.textContent = message || '生成歌曲后，可在这里试听并选择一个输出。';
      showResults();
      updateControls();
    }

    function readConfig() {
      if (!reference) {
        referenceButton.focus();
        throw Error('请选择或上传参考音频');
      }
      const fields = form.elements;
      const lyrics = fields.lyrics.value.trim(), prompt = fields.prompt.value.trim();
      if (!lyrics) { fields.lyrics.focus(); throw Error('请填写歌词'); }
      if (!prompt) { fields.prompt.focus(); throw Error('请填写提示词'); }
      return {
        reference,
        lyrics,
        prompt,
        model: fields.model.value,
        count: Number(fields.count.value),
        negativePrompt: fields.negativePrompt.value.trim(),
        styleStrength: Number(fields.styleStrength.value),
        randomness: Number(fields.randomness.value),
        instrumental: false,
        skipCopyrightCheck: fields.skipCopyrightCheck.checked
      };
    }

    function releaseReference() {
      referenceAudio.pause();
      referenceAudio.removeAttribute('src');
      if (referenceURL) URL.revokeObjectURL(referenceURL);
      referenceURL = null;
    }

    referenceButton.addEventListener('click', async () => {
      if (operation) return;
      error.textContent = '';
      try {
        requireCurrent();
        operation = 'reference';
        updateControls();
        const source = await chooseReference();
        if (!isOpen() || !source) return;
        requireCurrent();
        if (!source.blob?.size) throw Error('参考音频无法读取，请重新选择');
        const url = URL.createObjectURL(source.blob);
        releaseReference();
        reference = source;
        referenceURL = url;
        referenceAudio.src = url;
        referenceAudio.hidden = false;
        referenceTitle.textContent = source.title || '参考音频';
        referenceButton.textContent = '更换参考音频';
        invalidateResults('参考音频已选择，请生成歌曲。');
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

    function settingsChanged(event) {
      if (!settings.contains(event.target) || !event.target.matches('input, textarea, select')) return;
      dialog.querySelector('[data-creation-strength]').textContent = form.elements.styleStrength.value;
      dialog.querySelector('[data-creation-randomness]').textContent = form.elements.randomness.value;
      error.textContent = '';
      if (generatedConfig) invalidateResults('配置已修改，请重新生成歌曲。');
    }
    form.addEventListener('input', settingsChanged);
    form.addEventListener('change', settingsChanged);
    metadata.addEventListener('input', () => {
      error.textContent = '';
      updateControls();
    });
    results.addEventListener('change', event => {
      if (event.target.name !== 'outputCandidate' || !event.target.checked || operation) return;
      selectedId = event.target.value;
      error.textContent = '';
      updateControls();
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (operation) return;
      error.textContent = '';
      try {
        requireCurrent();
        const config = readConfig();
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
        showResults();
      } catch (failure) {
        if (isOpen()) {
          if (operation === 'generating') invalidateResults('歌曲未生成，请重新生成。');
          error.textContent = failure.message || '歌曲生成失败，请重试';
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
      if (operation || !candidate || !generatedConfig || !details.name || !details.style) return;
      error.textContent = '';
      try {
        requireCurrent();
        operation = 'submitting';
        updateControls();
        await submitPersona(candidate, generatedConfig, details);
        if (isOpen()) dialog.close();
      } catch (failure) {
        if (isOpen()) error.textContent = failure.message || 'Persona 创建失败，请重试';
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
      if (trigger?.isConnected) trigger.focus();
    }, { once: true });

    document.body.append(dialog);
    dialog.showModal();
    updateControls();
    referenceButton.focus();
    return dialog;
  }

  window.orchestraTimbreCreation = { open };
})();
