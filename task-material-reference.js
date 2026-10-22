/* Insert a text-material snapshot at the @ query in an editable task field. */
(() => {
  const panel = document.querySelector('#taskDetailPanel');
  const fields = 'textarea[data-task-field], input[data-task-field], textarea[data-selected-lyrics-editor]';
  const enhanced = new WeakSet();
  let state = null, inserting = false, composing = false;
  const account = () => localStorage.getItem('orchestra-demo-account') || 'demo-user';
  const activeTeam = () => document.querySelector('.workspace-option.active')?.dataset.workspaceId || 'orchestra-studio';
  const activeTask = () => productionTasks.find(task => task.id === selectedTaskId);
  const taskTeam = task => projectData.find(project => project.id === task.projectId)?.teamId || 'orchestra-studio';
  const keyFor = record => JSON.stringify([record.sourceLibrary, record.id]);
  function editable(field) {
    return field?.matches?.(fields) && panel.contains(field) && !field.disabled && !field.readOnly &&
      (field.tagName === 'TEXTAREA' || ['text', 'search'].includes(field.type)) && activeTask()?.status === 'in_progress';
  }
  function queryAt(field) {
    const end = field.selectionStart;
    if (!Number.isInteger(end) || end !== field.selectionEnd) return null;
    const start = field.value.lastIndexOf('@', end - 1);
    if (start < 0 || start >= end || (start > 0 && /[\w.%+\-]/.test(field.value[start - 1]))) return null;
    const query = field.value.slice(start + 1, end);
    if (/[\r\n@]/.test(query) || query.length > 80) return null;
    return { start, end, query };
  }
  function catalog(team, scope = 'personal') {
    if (scope === 'workflow') return window.orchestraTaskResultResources?.list(activeTask(), 'text') || [];
    const api = window.orchestraMaterialLibrary;
    if (!api?.listForComposition) throw new Error('素材库暂时不可用，请稍后重试');
    return api.listForComposition(team).filter(record => record.type === 'text' && record.sourceLibrary === scope);
  }
  const popup = document.createElement('section');
  popup.className = 'task-material-reference'; popup.hidden = true;
  popup.setAttribute('aria-label', '引用文本素材');
  popup.innerHTML = `<header><div><b>引用文本素材</b><small>选择后将正文插入当前输入框</small></div><button type="button" data-reference-close aria-label="关闭素材选择">×</button></header>
    <div class="task-material-reference-libraries" role="group" aria-label="文本来源"><button type="button" data-reference-library="personal" aria-pressed="true">个人素材</button><button type="button" data-reference-library="team" aria-pressed="false">团队素材</button><button type="button" data-reference-library="workflow" aria-pressed="false">结果资源<span class="task-result-reference-info" role="img" aria-label="仅展示当前工作流本次运行中已设为输出或备选的资源。" title="仅展示当前工作流本次运行中已设为输出或备选的资源。">ⓘ</span></button></div>
    <p class="task-material-reference-status" role="status"></p><div id="taskTextMaterialOptions" class="task-material-reference-options" role="listbox" aria-label="文本素材"></div>
    <footer>输入 @ 后继续搜索 · ↑↓ 选择 · Enter 引用 · Esc 关闭</footer>`;
  document.body.append(popup);
  const options = popup.querySelector('.task-material-reference-options');
  const status = popup.querySelector('.task-material-reference-status');
  function close() {
    if (state) for (const [name, value] of Object.entries(state.attributes)) {
      if (value === null) state.field.removeAttribute(name); else state.field.setAttribute(name, value);
    }
    state = null; popup.hidden = true; options.replaceChildren();
  }
  function sameContext() {
    return state && editable(state.field) && state.field.isConnected && state.taskId === selectedTaskId &&
      state.account === account() && state.team === activeTeam() && state.team === taskTeam(activeTask());
  }
  function position() {
    if (!state) return;
    const rect = state.field.getBoundingClientRect();
    const width = Math.min(420, window.innerWidth - 24);
    const below = window.innerHeight - rect.bottom - 12, above = rect.top - 12;
    const upwards = below < 220 && above > below;
    const available = Math.min(420, Math.max(160, upwards ? above : below), window.innerHeight - 24);
    popup.style.width = `${width}px`; popup.style.maxHeight = `${available}px`;
    popup.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    const height = popup.getBoundingClientRect().height;
    popup.style.top = `${Math.max(12, Math.min(upwards ? rect.top - height - 6 : rect.bottom + 6, window.innerHeight - height - 12))}px`;
  }
  function highlight(index, scroll = false) {
    if (!state) return;
    state.index = index;
    options.querySelectorAll('[data-reference-option]').forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    if (index >= 0) {
      state.field.setAttribute('aria-activedescendant', `taskTextMaterialOption-${index}`);
      if (scroll) options.querySelector(`#taskTextMaterialOption-${index}`)?.scrollIntoView({ block: 'nearest' });
    } else state.field.removeAttribute('aria-activedescendant');
  }
  function render() {
    if (!sameContext()) { close(); return; }
    const selectedKey = state.matches?.[state.index] && keyFor(state.matches[state.index]);
    try {
      const query = state.range.query.trim().toLocaleLowerCase();
      state.matches = catalog(state.team, state.library).filter(record => !query || `${record.title}\n${record.content || ''}\n${record.node || ''}`.toLocaleLowerCase().includes(query));
      status.textContent = state.matches.length ? `${state.matches.length} 个文本${state.library === 'workflow' ? '结果' : '素材'}` : query ? '未找到匹配的文本，换个关键词试试' : state.library === 'workflow' ? '暂无文本结果，请先将当前运行的文本设为输出或备选' : '暂无文本素材，可先到素材库添加';
      const optionMarkup = (record, i) => `<button type="button" id="taskTextMaterialOption-${i}" role="option" aria-selected="false" tabindex="-1" data-reference-option="${i}"><span class="task-material-reference-option-title"><b>${escapeHtml(record.title)}</b><small>${record.sourceLibrary === 'workflow' ? (record.selectionState === 'backup' ? '备选' : '输出') : record.sourceLibrary === 'personal' ? '个人' : '团队'}</small></span><span class="task-material-reference-path">${escapeHtml(record.sourceLibrary === 'workflow' ? `结果资源 / ${record.folderPath}` : record.folderPath)}</span><span class="task-material-reference-preview">${escapeHtml(String(record.content || '').slice(0, 220))}</span></button>`;
      options.innerHTML = state.library === 'workflow' ? [['selected', '输出'], ['backup', '备选']].map(([group, label]) => {
        const items = state.matches.map((record, index) => ({ record, index })).filter(({ record }) => record.selectionState === group);
        return `<div class="task-result-reference-group" role="group" aria-label="${label}"><h3>${label}<span>${items.length}</span></h3>${items.map(({ record, index }) => optionMarkup(record, index)).join('') || `<p>暂无${label}文本</p>`}</div>`;
      }).join('') : state.matches.map(optionMarkup).join('');
      const previous = state.matches.findIndex(record => keyFor(record) === selectedKey);
      highlight(state.matches.length ? Math.max(0, previous) : -1);
    } catch (error) {
      state.matches = []; state.index = -1; options.replaceChildren();
      state.field.removeAttribute('aria-activedescendant'); status.textContent = error.message;
    }
    popup.querySelectorAll('[data-reference-library]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.referenceLibrary === state.library)));
    position();
  }
  function sync(field) {
    if (inserting || composing) return;
    const range = editable(field) && queryAt(field);
    if (!range) { close(); return; }
    if (!state || state.field !== field || state.taskId !== selectedTaskId || state.account !== account() || state.team !== activeTeam()) {
      close();
      const attributes = Object.fromEntries(['aria-autocomplete', 'aria-haspopup', 'aria-controls', 'aria-expanded', 'aria-activedescendant'].map(name => [name, field.getAttribute(name)]));
      state = { field, taskId: selectedTaskId, account: account(), team: activeTeam(), library: 'personal', matches: [], index: -1, attributes };
      field.setAttribute('aria-autocomplete', 'list'); field.setAttribute('aria-haspopup', 'listbox');
      field.setAttribute('aria-controls', options.id); field.setAttribute('aria-expanded', 'true');
    }
    state.range = range; state.value = field.value; popup.hidden = false; render();
  }
  function insert(index) {
    if (!sameContext()) { close(); return; }
    const { field, range, value, team } = state, choice = state.matches[index];
    if (!choice || field.value !== value) { sync(field); return; }
    try {
      const latest = catalog(team, choice.sourceLibrary).find(record => keyFor(record) === keyFor(choice));
      if (!latest) throw new Error(choice.sourceLibrary === 'workflow' ? '该文本已移除或不再是输出、备选，请重新选择' : '该文本素材已移除，请重新选择');
      let content = String(latest.content || '');
      if (!content.trim()) throw new Error('该素材暂无文本内容，请选择其他素材');
      if (field.tagName !== 'TEXTAREA') content = content.replace(/\r\n|\r|\n/g, ' ');
      if (field.maxLength >= 0 && value.length - (range.end - range.start) + content.length > field.maxLength) {
        throw new Error(`引用后将超过输入框的 ${field.maxLength} 个字符上限，请精简内容后重试`);
      }
      inserting = true;
      close(); field.focus({ preventScroll: true });
      field.setRangeText(content, range.start, range.end, 'end');
      // Use the task center's existing input handler to update and persist the form values.
      field.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (error) { showToast(error.message, 'error'); if (state) render(); }
    finally { inserting = false; }
  }
  function enhance() {
    if (state && !sameContext()) close();
    panel.querySelectorAll(fields).forEach(field => {
      if (!editable(field) || enhanced.has(field)) return;
      enhanced.add(field);
      field.placeholder = `${field.placeholder ? `${field.placeholder} · ` : ''}输入 @ 引用素材库或结果资源中的文本`;
    });
  }
  panel.addEventListener('input', event => { if (!event.isComposing && !inserting) sync(event.target); });
  panel.addEventListener('compositionstart', () => { composing = true; close(); });
  panel.addEventListener('compositionend', event => { composing = false; sync(event.target); });
  panel.addEventListener('focusin', event => { enhance(); sync(event.target); });
  panel.addEventListener('click', event => { if (editable(event.target)) sync(event.target); });
  panel.addEventListener('keydown', event => {
    if (!state || event.target !== state.field || event.isComposing || composing || event.keyCode === 229) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === 'Tab') { close(); return; }
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && state.matches.length) {
      event.preventDefault(); highlight((state.index + (event.key === 'ArrowDown' ? 1 : -1) + state.matches.length) % state.matches.length, true);
    } else if (event.key === 'Enter' && state.index >= 0) { event.preventDefault(); insert(state.index); }
  });
  panel.addEventListener('keyup', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) sync(event.target); });
  popup.addEventListener('pointerdown', event => event.preventDefault());
  popup.addEventListener('click', event => {
    if (event.target.closest('[data-reference-close]')) { close(); return; }
    const libraryButton = event.target.closest('[data-reference-library]');
    if (libraryButton && state) { state.library = libraryButton.dataset.referenceLibrary; state.index = -1; render(); return; }
    const option = event.target.closest('[data-reference-option]');
    if (option) insert(Number(option.dataset.referenceOption));
  });
  document.addEventListener('pointerdown', event => { if (state && event.target !== state.field && !popup.contains(event.target)) close(); });
  document.addEventListener('focusin', event => { if (state && event.target !== state.field && !popup.contains(event.target)) close(); });
  document.addEventListener('selectionchange', () => {
    if (!state || document.activeElement !== state.field) return;
    const range = queryAt(state.field);
    if (!range) close();
    else if (range.start !== state.range.start || range.end !== state.range.end) sync(state.field);
  });
  window.addEventListener('resize', position);
  document.addEventListener('scroll', event => { if (state && !popup.contains(event.target)) close(); }, true);
  window.addEventListener('storage', event => { if (state && (event.key === 'orchestra-demo-account' || event.key?.startsWith('orchestra-material-'))) render(); });
  window.addEventListener('pagehide', close);
  new MutationObserver(enhance).observe(panel, { childList: true, subtree: true });
  new MutationObserver(() => { if (!document.querySelector('#taskPage.active')) close(); }).observe(document.querySelector('#taskPage'), { attributes: true, attributeFilter: ['class'] });
  enhance();
})();
