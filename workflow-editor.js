(() => {
  const BASE_DRAFT_KEY = 'orchestra-september-workflow-draft';
  const BASE_VERSIONS_KEY = 'orchestra-september-workflow-versions';
  const storageKey = (base, workflowId) => workflowId === 'primary' ? base : `${base}:${workflowId}`;
  let activeWorkflowId = 'primary';
  let activeDraftKey = storageKey(BASE_DRAFT_KEY, activeWorkflowId);
  let activeVersionsKey = storageKey(BASE_VERSIONS_KEY, activeWorkflowId);
  const NODE_W = 300;
  const defs = {
    textInput: { title: '文本输入', subtitle: '基础输入节点', symbol: '文', color: '#6d78cc', category: 'input' },
    audioUpload: { title: '音频上传', subtitle: '基础输入节点', symbol: '音', color: '#3f9a91', category: 'input' },
    lyricsMenu: { title: '歌词', subtitle: '选择歌词功能', symbol: '文', color: '#e58a3e', category: 'lyrics' },
    songMenu: { title: '歌曲', subtitle: '选择歌曲功能', symbol: '♫', color: '#d45398', category: 'song' },
    writeLyrics: { title: '自己写歌词', subtitle: '歌词节点', symbol: '写', color: '#e58a3e', category: 'lyrics' },
    aiLyrics: { title: 'AI 生成歌词', subtitle: '歌词节点', symbol: 'AI', color: '#8758e9', category: 'lyrics' },
    refLyrics: { title: '基于参考生成歌词', subtitle: '歌词节点', symbol: '参', color: '#b266d2', category: 'lyrics' },
    uploadSong: { title: '自己上传歌曲', subtitle: '歌曲节点', symbol: '↑', color: '#438ed8', category: 'song' },
    aiSong: { title: 'AI 生成歌曲', subtitle: '歌曲节点', symbol: 'AI', color: '#d45398', category: 'song' },
    refSong: { title: '基于参考生成歌曲', subtitle: '歌曲节点', symbol: '参', color: '#5e76db', category: 'song' },
    sampleSong: { title: '基于采样生成歌曲', subtitle: '歌曲节点', symbol: '采', color: '#36a68c', category: 'song' },
    playlistSong: { title: '基于歌单生成歌曲', subtitle: '歌曲节点', symbol: '单', color: '#8a5dd8', category: 'song' }
  };
  const builtInPublishedSnapshots = {
    'midnight-melody': [{ version: 'V2.1', name: '午夜旋律', publishedAt: Date.parse('2026-09-01T14:25:00+08:00'), nodes: [
      { id: 'midnight-write-lyrics', type: 'writeLyrics', x: 100, y: 100 },
      { id: 'midnight-ai-song', type: 'aiSong', x: 460, y: 100 },
      { id: 'midnight-sample-song', type: 'sampleSong', x: 820, y: 100 }
    ], edges: [
      { id: 'midnight-control-1', edgeType: 'control', from: 'midnight-write-lyrics', to: 'midnight-ai-song' },
      { id: 'midnight-control-2', edgeType: 'control', from: 'midnight-ai-song', to: 'midnight-sample-song' }
    ] }],
    'reference-lab': [{ version: 'V1.0', name: '参考歌实验室', publishedAt: Date.parse('2026-08-24T12:25:00+08:00'), nodes: [
      { id: 'reference-text-input', type: 'textInput', x: 100, y: 100 },
      { id: 'reference-lyrics', type: 'refLyrics', x: 460, y: 100 },
      { id: 'reference-ai-song', type: 'aiSong', x: 820, y: 100 },
      { id: 'reference-song', type: 'refSong', x: 1180, y: 100 }
    ], edges: [
      { id: 'reference-control-1', edgeType: 'control', from: 'reference-text-input', to: 'reference-lyrics' },
      { id: 'reference-control-2', edgeType: 'control', from: 'reference-lyrics', to: 'reference-ai-song' },
      { id: 'reference-control-3', edgeType: 'control', from: 'reference-ai-song', to: 'reference-song' }
    ] }],
    'reference-production': [{ version: 'V1.0', name: '参考词曲完整流程', publishedAt: Date.parse('2026-09-08T09:30:00+08:00'), nodes: [
      { id: 'complete-reference-lyrics', type: 'refLyrics', title: '基于参考生成歌词', x: 100, y: 100 },
      { id: 'complete-reference-song', type: 'refSong', title: '基于参考曲生成歌曲', x: 460, y: 100 }
    ], edges: [
      { id: 'complete-reference-control-1', edgeType: 'control', from: 'complete-reference-lyrics', to: 'complete-reference-song' }
    ] }]
  };
  const defaultState = () => ({ schemaVersion: 9, name: '未命名音乐工作流', scale: .86, pan: { x: 110, y: 90 }, updatedAt: Date.now(), nodes: [], edges: [] });
  const parse = (raw, fallback) => { try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  let state = parse(localStorage.getItem(activeDraftKey), null) || defaultState();
  if (state.schemaVersion !== 9) state = defaultState();
  state.nodes.forEach(node => node.status = 'idle');
  let versions = parse(localStorage.getItem(activeVersionsKey), []);
  let selectedId = null, pending = null, portDragging = null, dragging = null, panning = null, saveTimer = null;
  let undo = [], redo = [];

  const stage = document.querySelector('#canvasStage');
  const viewport = document.querySelector('#canvasViewport');
  const zoomLayer = document.querySelector('#canvasZoomLayer');
  const nodeLayer = document.querySelector('#nodeLayer');
  const edgeLayer = document.querySelector('#edgeLayer');
  const palette = document.querySelector('#nodePalette');
  const deep = value => JSON.parse(JSON.stringify(value));
  const snapshot = () => deep({ schemaVersion: 9, name: state.name, scale: state.scale, pan: state.pan, nodes: state.nodes, edges: state.edges });
  const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const pushUndo = () => { undo.push(snapshot()); if (undo.length > 40) undo.shift(); redo = []; };
  const nodeById = id => state.nodes.find(node => node.id === id);
  const dataKindsMatch = (from, to) => from === to || (from === 'text' && to === 'lyrics') || (from === 'audio' && to === 'song');

  function portsFor(type) {
    const inputs = [], outputs = [];
    if (!type.endsWith('Menu')) {
      inputs.push({ key: 'control-in', edgeType: 'control', label: '控制', required: false });
      outputs.push({ key: 'control-out', edgeType: 'control', label: '控制', required: false });
    }
    const addInput = (key, kind, label, required = false) => inputs.push({ key, edgeType: 'data', kind, label, required });
    const addOutput = (key, kind, label) => outputs.push({ key, edgeType: 'data', kind, label });
    if (type === 'textInput') addOutput('text-out', 'text', '文本');
    if (type === 'audioUpload') addOutput('audio-out', 'audio', '音频');
    if (type === 'writeLyrics') { addOutput('title-out', 'title', '歌名'); addOutput('lyrics-out', 'lyrics', '歌词'); }
    if (type === 'aiLyrics') addOutput('lyrics-out', 'lyrics', '歌词');
    if (type === 'refLyrics') { addInput('lyrics-in', 'lyrics', '参考歌词', true); addOutput('lyrics-out', 'lyrics', '歌词'); }
    if (type === 'uploadSong') addOutput('song-out', 'song', '歌曲');
    if (type === 'aiSong') { addInput('lyrics-in', 'lyrics', '歌词', false); addOutput('song-out', 'song', '歌曲'); }
    if (type === 'refSong' || type === 'sampleSong') { addInput('song-in', 'song', '参考歌曲', true); addInput('lyrics-in', 'lyrics', '歌词', false); addOutput('song-out', 'song', '歌曲'); }
    if (type === 'playlistSong') {
      addInput('song-1-in', 'song', '参考歌曲 1', true);
      addInput('song-2-in', 'song', '参考歌曲 2');
      addInput('song-3-in', 'song', '参考歌曲 3');
      addInput('song-4-in', 'song', '参考歌曲 4');
      addInput('lyrics-in', 'lyrics', '歌词');
      addOutput('song-out', 'song', '歌曲');
    }
    return { inputs, outputs };
  }
  function portTop(port, index) {
    if (port.edgeType === 'control') return 42;
    return 112 + (index - 1) * 29;
  }
  function portMarkup(node, side) {
    const ports = portsFor(node.type)[side];
    return ports.map((port, index) => {
      const top = portTop(port, index);
      const direction = side === 'inputs' ? 'input' : 'output';
      const labelClass = side === 'inputs' ? 'input-label' : 'output-label';
      return `<button class="node-port ${direction} ${port.edgeType}" style="top:${top}px" data-port="${direction}" data-port-key="${port.key}" data-edge-type="${port.edgeType}" data-kind="${port.kind || ''}" aria-label="${port.label}${direction === 'input' ? '输入' : '输出'}端口"></button><span class="port-cluster-label ${labelClass} ${port.required ? 'required' : ''}" style="top:${top - 6}px">${port.label}</span>`;
    }).join('');
  }
  function featureMenu(node) {
    if (node.type === 'lyricsMenu') return `<div class="feature-title"><b>选择歌词功能</b><small>3 项能力</small></div><div class="feature-grid">
      <button class="feature-choice" data-switch-type="writeLyrics"><i>写</i><span><b>自己写歌词</b><small>填写歌名与歌词</small></span></button>
      <button class="feature-choice" data-switch-type="aiLyrics"><i>AI</i><span><b>AI 生成歌词</b><small>输入提示词生成歌词</small></span></button>
      <button class="feature-choice" data-switch-type="refLyrics"><i>参</i><span><b>基于参考生成歌词</b><small>连接参考歌词后改写</small></span></button>
    </div>`;
    return `<div class="feature-title"><b>选择歌曲功能</b><small>5 项能力</small></div><div class="feature-grid song-feature-grid">
      <button class="feature-choice" data-switch-type="uploadSong"><i>↑</i><span><b>自己上传歌曲</b><small>上传本地音频</small></span></button>
      <button class="feature-choice" data-switch-type="aiSong"><i>AI</i><span><b>AI 生成歌曲</b><small>歌词输入可选</small></span></button>
      <button class="feature-choice" data-switch-type="refSong"><i>参</i><span><b>基于参考生成</b><small>需要参考歌曲</small></span></button>
      <button class="feature-choice" data-switch-type="sampleSong"><i>采</i><span><b>基于采样生成</b><small>需要参考歌曲</small></span></button>
      <button class="feature-choice" data-switch-type="playlistSong"><i>单</i><span><b>基于歌单生成</b><small>支持 1–4 首参考</small></span></button>
    </div>`;
  }
  const field = (node, key, label, options = {}) => {
    const value = node.data?.[key] ?? '';
    const required = options.required ? '<em>必填</em>' : '<small>选填</small>';
    if (options.type === 'textarea') return `<label><span>${label}${required}</span><textarea data-field="${key}" placeholder="${options.placeholder || ''}">${value}</textarea></label>`;
    if (options.type === 'select') return `<label><span>${label}${required}</span><select data-field="${key}">${options.values.map(item => `<option ${String(value) === String(item) ? 'selected' : ''}>${item}</option>`).join('')}</select></label>`;
    return `<label><span>${label}${required}</span><input data-field="${key}" value="${String(value).replaceAll('"', '&quot;')}" placeholder="${options.placeholder || ''}" /></label>`;
  };
  function commonSongFields(node) {
    return `${field(node, 'prompt', 'Prompt', { required: true, type: 'textarea', placeholder: '描述曲风、情绪、节奏与演唱方向' })}<div class="form-row">${field(node, 'title', '标题', { placeholder: '歌曲标题' })}${field(node, 'model', '模型版本', { type: 'select', values: ['Music V4', 'Music V3.5', 'Fast'] })}</div>${field(node, 'negative', '反向提示词', { placeholder: '不希望出现的元素' })}${field(node, 'rounds', '生成轮数', { type: 'select', values: [1, 2, 3, 4] })}`;
  }
  function outputBox(node, emptyText) {
    return `<div class="generation-output ${node.result ? 'ready' : ''}">${node.result || emptyText}</div>`;
  }
  function inputPlaceholder(node, key, label, required = false) {
    const connected = state.edges.some(edge => edge.to === node.id && edge.toPort === key);
    return `<div class="input-placeholder ${connected ? 'connected' : ''}"><b>${label}${required ? ' *' : ''}</b><em>${connected ? '✓ 已连接' : '等待连线'}</em></div>`;
  }
  function nodeForm(node) {
    if (node.type.endsWith('Menu')) return featureMenu(node);
    if (node.type === 'textInput') return `<div class="feature-title"><b>填写文本内容</b><small>基础输入</small></div><div class="node-kind-legend"><span><i class="text"></i>文本输出</span></div><div class="node-form">${field(node, 'text', '文本内容', { required: true, type: 'textarea', placeholder: '输入可复用的文字、歌词或参考内容…' })}${outputBox(node, '填写后可连接到歌词输入端口')}</div><div class="node-run-row"><small>内容即时保存为草稿</small><button class="workflow-run">✓ 保存文本</button></div>`;
    if (node.type === 'audioUpload') return `<div class="feature-title"><b>上传音频</b><small>基础输入</small></div><label class="upload-drop"><input class="audio-upload" type="file" accept="audio/*" /><span><b>${node.data?.fileName || '点击选择音频文件'}</b><small>支持 MP3、WAV、M4A</small></span></label><div class="node-run-row"><small>可连接到参考歌曲输入端口</small><button class="workflow-run">✓ 确认上传</button></div>`;
    const switcher = `<button class="switch-feature" data-back-category="${defs[node.type].category}">更换功能</button>`;
    const run = label => `<div class="node-run-row"><small>${node.status === 'success' ? '✓ 已生成产物' : '等待执行'}</small><button class="workflow-run">▶ ${label}</button></div>`;
    if (node.type === 'writeLyrics') return `<div class="feature-title"><b>填写歌词内容</b>${switcher}</div><div class="node-kind-legend"><span><i class="title"></i>歌名输出</span><span><i class="lyrics"></i>歌词输出</span></div><div class="node-form">${field(node, 'title', '歌名', { placeholder: '输入歌名' })}${field(node, 'lyrics', '歌词', { type: 'textarea', placeholder: '在这里写歌词…' })}</div><div class="node-run-row"><small>填写内容实时作为输出</small><button class="workflow-run">✓ 保存内容</button></div>`;
    if (node.type === 'aiLyrics') return `<div class="feature-title"><b>生成设置</b>${switcher}</div><div class="node-form">${field(node, 'userPrompt', '用户提示词', { required: true, type: 'textarea', placeholder: '描述主题、情绪和表达方向' })}${field(node, 'systemPrompt', '系统提示词', { placeholder: '补充角色或写作要求' })}${field(node, 'count', '生成数量', { type: 'select', values: [1, 2, 3, 4] })}${outputBox(node, '运行后在此展示生成的歌词')}</div>${run('生成歌词')}`;
    if (node.type === 'refLyrics') return `<div class="feature-title"><b>参考改写设置</b>${switcher}</div><div class="node-dependency"><b>必需输入：</b>参考歌词</div><div class="input-placeholders">${inputPlaceholder(node, 'lyrics-in', '参考歌词', true)}</div><div class="node-form">${field(node, 'userPrompt', '用户提示词', { required: true, type: 'textarea', placeholder: '说明改写目标' })}${field(node, 'systemPrompt', '系统提示词', { placeholder: '选填' })}<div class="form-row">${field(node, 'count', '生成数量', { type: 'select', values: [1, 2, 3, 4] })}${field(node, 'rhyme', '韵脚', { placeholder: '如：ang' })}</div>${field(node, 'goldenLine', '金句', { placeholder: '希望保留或出现的句子' })}${field(node, 'avoid', '规避词', { placeholder: '不希望出现的词语' })}<div class="form-row">${field(node, 'imagery', '意象', { placeholder: '雨夜、车站…' })}${field(node, 'format', '歌词格式', { placeholder: '主歌/副歌' })}</div>${outputBox(node, '连接参考歌词并运行后展示结果')}</div>${run('参考生成')}`;
    if (node.type === 'uploadSong') return `<div class="feature-title"><b>上传音频</b>${switcher}</div><label class="upload-drop"><input class="song-upload" type="file" accept="audio/*" /><span><b>${node.data?.fileName || '点击选择歌曲文件'}</b><small>支持 MP3、WAV、M4A</small></span></label><div class="node-run-row"><small>上传完成后作为歌曲输出</small><button class="workflow-run">✓ 确认上传</button></div>`;
    const dependency = node.type === 'aiSong' ? '<b>可选输入：</b>歌词' : node.type === 'playlistSong' ? '<b>必需输入：</b>参考歌曲 1；其余歌曲和歌词可选' : '<b>必需输入：</b>参考歌曲；<b>可选输入：</b>歌词';
    let inputSlots = '';
    if (node.type === 'aiSong') inputSlots = inputPlaceholder(node, 'lyrics-in', '歌词（可选）');
    if (node.type === 'refSong' || node.type === 'sampleSong') inputSlots = inputPlaceholder(node, 'song-in', '参考歌曲', true) + inputPlaceholder(node, 'lyrics-in', '歌词（可选）');
    if (node.type === 'playlistSong') inputSlots = [1,2,3,4].map(index => inputPlaceholder(node, `song-${index}-in`, `参考歌曲 ${index}`, index === 1)).join('') + inputPlaceholder(node, 'lyrics-in', '歌词（可选）');
    return `<div class="feature-title"><b>歌曲生成设置</b>${switcher}</div><div class="node-dependency">${dependency}</div><div class="input-placeholders">${inputSlots}</div><div class="node-form">${commonSongFields(node)}${outputBox(node, '运行后在此展示生成的歌曲')}</div>${run('生成歌曲')}`;
  }
  function nodeHeight(type) {
    return ({ textInput: 330, audioUpload: 260, lyricsMenu: 250, songMenu: 330, writeLyrics: 350, aiLyrics: 420, refLyrics: 580, uploadSong: 260, aiSong: 500, refSong: 520, sampleSong: 520, playlistSong: 590 })[type] || 360;
  }
  function nodeHTML(node) {
    const def = defs[node.type];
    return `<article class="flow-node ${node.type.endsWith('Menu') ? 'menu-node' : ''} ${selectedId === node.id ? 'selected' : ''} ${node.status || ''}" data-id="${node.id}" style="left:${node.x}px;top:${node.y}px;--node-color:${def.color}">${portMarkup(node, 'inputs')}<header class="node-head"><span class="node-symbol">${def.symbol}</span><div class="node-title"><b>${node.title || def.title}</b><small>${def.subtitle}</small></div><i class="node-status"></i><button class="node-remove" aria-label="删除节点">×</button></header><div class="node-body">${nodeForm(node)}</div>${portMarkup(node, 'outputs')}</article>`;
  }

  function portPoint(node, portKey, side) {
    const ports = portsFor(node.type)[side];
    const index = Math.max(0, ports.findIndex(port => port.key === portKey));
    return { x: side === 'outputs' ? node.x + NODE_W : node.x, y: node.y + portTop(ports[index] || { edgeType: 'control' }, index) };
  }
  function pathFor(edge) {
    const from = nodeById(edge.from), to = nodeById(edge.to);
    if (!from || !to) return '';
    const a = portPoint(from, edge.fromPort, 'outputs'), b = portPoint(to, edge.toPort, 'inputs');
    const curve = Math.max(70, Math.abs(b.x - a.x) * .48);
    return `M ${a.x} ${a.y} C ${a.x + curve} ${a.y}, ${b.x - curve} ${b.y}, ${b.x} ${b.y}`;
  }
  function drawEdges() {
    edgeLayer.innerHTML = state.edges.map(edge => { const path = pathFor(edge); if (!path) return ''; const running = nodeById(edge.from)?.status === 'running' || nodeById(edge.to)?.status === 'running'; return `<g data-edge="${edge.id}"><path class="edge-bg ${edge.edgeType}" d="${path}"></path><path class="edge ${edge.edgeType} ${running ? 'running' : ''}" d="${path}"></path></g>`; }).join('');
  }
  function renderNodes() {
    nodeLayer.innerHTML = state.nodes.map(nodeHTML).join('');
    document.querySelector('#canvasEmptyHint').classList.toggle('show', !state.nodes.length);
    bindDrag(); drawEdges(); syncInspector();
  }
  function transform() {
    const scale = Math.round(state.scale * 100) / 100;
    state.scale = scale;
    viewport.style.transform = `translate(${Math.round(state.pan.x * 2) / 2}px,${Math.round(state.pan.y * 2) / 2}px)`;
    zoomLayer.style.zoom = String(scale);
    document.querySelector('#zoomValue').textContent = `${Math.round(scale * 100)}%`;
  }
  function renderAll() { document.querySelector('#canvasTitle').value = state.name; transform(); renderNodes(); renderVersions(); }
  function bindDrag() {
    nodeLayer.querySelectorAll('.flow-node').forEach(element => {
      const node = nodeById(element.dataset.id);
      element.querySelector('.node-head').addEventListener('pointerdown', event => { if (event.target.closest('button')) return; event.stopPropagation(); selectNode(node.id); pushUndo(); dragging = { id: node.id, x: node.x, y: node.y, clientX: event.clientX, clientY: event.clientY }; });
    });
  }
  function selectNode(id) { selectedId = id; nodeLayer.querySelectorAll('.flow-node').forEach(node => node.classList.toggle('selected', node.dataset.id === id)); syncInspector(); }
  function clearSelection() { selectedId = null; nodeLayer.querySelectorAll('.flow-node').forEach(node => node.classList.remove('selected')); syncInspector(); }
  function syncInspector() {}
  function persistDraft() { state.updatedAt = Date.now(); localStorage.setItem(activeDraftKey, JSON.stringify({ ...state, nodes: state.nodes.map(node => ({ ...node, status: 'idle' })) })); }
  function queueDraft() {
    const box = document.querySelector('.draft-state'), label = document.querySelector('#draftStatus');
    box.classList.add('saving'); label.textContent = '正在保存草稿…'; clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { persistDraft(); box.classList.remove('saving'); label.textContent = `草稿已自动保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`; }, 220);
  }
  function addNode(type, x, y) {
    pushUndo(); const rect = stage.getBoundingClientRect(); const def = defs[type];
    const index = state.nodes.length;
    const viewLeft = Math.max(40, (74 - state.pan.x) / state.scale);
    const viewTop = Math.max(80, (90 - state.pan.y) / state.scale);
    const autoX = viewLeft + (index % 3) * (NODE_W + 92);
    const autoY = viewTop + Math.floor(index / 3) * 660;
    const node = { id: makeId('node'), type, title: def.title, x: Math.max(10, x ?? autoX), y: Math.max(10, y ?? autoY), data: {}, status: 'idle', result: '', strength: 72 };
    state.nodes.push(node); renderNodes(); selectNode(node.id); toggleLibrary(false); queueDraft(); showToast(`已添加「${def.title}」节点`);
  }
  function changeType(id, type) {
    const node = nodeById(id); if (!node) return; pushUndo(); state.edges = state.edges.filter(edge => edge.from !== id && edge.to !== id); node.type = type; node.title = defs[type].title; node.data = {}; node.result = ''; node.status = 'idle'; renderNodes(); selectNode(id); queueDraft();
  }
  function deleteNode(id = selectedId) { if (!id) { showToast('请先选择需要删除的节点', 'error'); return; } pushUndo(); state.nodes = state.nodes.filter(node => node.id !== id); state.edges = state.edges.filter(edge => edge.from !== id && edge.to !== id); if (selectedId === id) selectedId = null; renderNodes(); queueDraft(); showToast('节点已删除'); }
  function markCompatibleInputs(source) {
    nodeLayer.querySelectorAll('.node-port.input').forEach(port => {
      const targetNodeId = port.closest('.flow-node')?.dataset.id;
      const occupied = state.edges.some(edge => edge.to === targetNodeId && edge.toPort === port.dataset.portKey);
      const compatible = !occupied && source.edgeType === port.dataset.edgeType && (source.edgeType === 'control' || dataKindsMatch(source.kind, port.dataset.kind));
      port.classList.toggle('compatible-target', compatible);
    });
  }
  function clearPendingConnection() {
    pending = null;
    nodeLayer.querySelectorAll('.node-port').forEach(port => port.classList.remove('pending', 'compatible-target'));
  }
  function connect(nodeId, direction, button) {
    const info = { nodeId, direction, portKey: button.dataset.portKey, edgeType: button.dataset.edgeType, kind: button.dataset.kind };
    const kindLabel = { text: '文本', audio: '音频', song: '歌曲', title: '歌名', lyrics: '歌词' };
    if (direction === 'output') { clearPendingConnection(); pending = info; button.classList.add('pending'); markCompatibleInputs(info); showToast(`请选择${info.edgeType === 'control' ? '控制' : kindLabel[info.kind] || '数据'}输入端口，或拖拽完成连接`); return; }
    if (!pending || pending.direction !== 'output') { showToast('请先选择一个输出端口', 'error'); return; }
    if (pending.nodeId === nodeId) { showToast('不能连接同一个节点的输入和输出', 'error'); return; }
    if (pending.edgeType !== info.edgeType || (info.edgeType === 'data' && !dataKindsMatch(pending.kind, info.kind))) { showToast('端口类型不匹配，无法连接', 'error'); return; }
    if (state.edges.some(edge => edge.to === nodeId && edge.toPort === info.portKey)) { showToast('该输入端口已有连接', 'error'); return; }
    const edgeType = pending.edgeType;
    pushUndo(); state.edges.push({ id: makeId('edge'), edgeType: info.edgeType, kind: info.kind, from: pending.nodeId, fromPort: pending.portKey, to: nodeId, toPort: info.portKey }); clearPendingConnection(); renderNodes(); queueDraft(); showToast(`${edgeType === 'control' ? '控制线' : '数据线'}已连接`);
  }
  function missingDependencies(node) {
    const missing = [];
    portsFor(node.type).inputs.filter(port => port.required).forEach(port => { if (!state.edges.some(edge => edge.to === node.id && edge.toPort === port.key)) missing.push(port.label); });
    if (['aiLyrics', 'refLyrics'].includes(node.type) && !node.data?.userPrompt?.trim()) missing.push('用户提示词');
    if (['aiSong', 'refSong', 'sampleSong', 'playlistSong'].includes(node.type) && !node.data?.prompt?.trim()) missing.push('Prompt');
    if (node.type === 'uploadSong' && !node.data?.fileName) missing.push('歌曲文件');
    if (node.type === 'textInput' && !node.data?.text?.trim()) missing.push('文本内容');
    if (node.type === 'audioUpload' && !node.data?.fileName) missing.push('音频文件');
    return missing;
  }
  async function runNode(id, quiet = false) {
    const node = nodeById(id); if (!node || node.type.endsWith('Menu')) { showToast('请先选择具体功能', 'error'); return false; }
    if (node.type === 'writeLyrics') { node.result = `${node.data?.title || '未命名'} · ${node.data?.lyrics || '尚未填写歌词'}`; node.status = 'success'; renderNodes(); queueDraft(); return true; }
    const missing = missingDependencies(node);
    if (missing.length) { node.status = 'error'; renderNodes(); showToast(`缺少：${missing.join('、')}`, 'error'); return false; }
    if (node.type === 'textInput') { node.result = node.data.text; node.status = 'success'; renderNodes(); queueDraft(); if (!quiet) showToast('文本已保存'); return true; }
    if (node.type === 'audioUpload') { node.result = node.data.fileName; node.status = 'success'; renderNodes(); queueDraft(); if (!quiet) showToast('音频已上传'); return true; }
    node.status = 'running'; renderNodes(); await new Promise(resolve => setTimeout(resolve, 700));
    if (['aiLyrics', 'refLyrics'].includes(node.type)) node.result = `【生成歌词】\n${node.data.userPrompt}\n夜色沿着城市缓缓落下，新的故事正在生长……`;
    else if (node.type === 'uploadSong') node.result = node.data.fileName;
    else node.result = `♫ ${node.data.title || defs[node.type].title} · 已生成歌曲产物`;
    node.status = 'success'; renderNodes(); queueDraft(); if (!quiet) showToast(`「${defs[node.type].title}」运行成功`); return true;
  }
  function executionOrder() {
    const executable = state.nodes.filter(node => !node.type.endsWith('Menu'));
    const indegree = new Map(executable.map(node => [node.id, 0]));
    state.edges.filter(edge => edge.edgeType === 'control').forEach(edge => { if (indegree.has(edge.to)) indegree.set(edge.to, indegree.get(edge.to) + 1); });
    const queue = executable.filter(node => indegree.get(node.id) === 0), result = [];
    while (queue.length) { const node = queue.shift(); result.push(node); state.edges.filter(edge => edge.edgeType === 'control' && edge.from === node.id).forEach(edge => { if (!indegree.has(edge.to)) return; indegree.set(edge.to, indegree.get(edge.to) - 1); if (indegree.get(edge.to) === 0) queue.push(nodeById(edge.to)); }); }
    return result.length === executable.length ? result : executable;
  }
  async function runAll() { const button = document.querySelector('#runAll'); button.disabled = true; let success = true; const nodes = executionOrder(); if (!nodes.length) { button.disabled = false; showToast('画布中暂无可运行节点', 'error'); return; } for (const node of nodes) { const ok = await runNode(node.id, true); if (!ok) { success = false; break; } } button.disabled = false; if (success) showToast('画布运行完成'); }
  function setZoom(next, anchor) { const old = state.scale; next = Math.max(.5, Math.min(1.5, Math.round(next * 20) / 20)); if (anchor) { const rect = stage.getBoundingClientRect(), ax = anchor.x - rect.left, ay = anchor.y - rect.top, cx = (ax - state.pan.x) / old, cy = (ay - state.pan.y) / old; state.pan.x = ax - cx * next; state.pan.y = ay - cy * next; } state.scale = next; transform(); queueDraft(); }
  function canvasCenter() { const rect = stage.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; }
  function fitCanvas() { if (!state.nodes.length) { state.pan = { x: 90, y: 90 }; setZoom(.85); return; } const rect = stage.getBoundingClientRect(), minX = Math.min(...state.nodes.map(node => node.x)), minY = Math.min(...state.nodes.map(node => node.y)), maxX = Math.max(...state.nodes.map(node => node.x + NODE_W)), maxY = Math.max(...state.nodes.map(node => node.y + nodeHeight(node.type))); const topInset = 76, bottomInset = 84, sideInset = 70; const rawScale = Math.min(1, (rect.width - sideInset * 2) / (maxX - minX), (rect.height - topInset - bottomInset) / (maxY - minY)); const scale = Math.max(.5, Math.floor(rawScale * 20) / 20); state.scale = scale; state.pan = { x: (rect.width - (maxX - minX) * scale) / 2 - minX * scale, y: topInset + Math.max(0, (rect.height - topInset - bottomInset - (maxY - minY) * scale) / 2) - minY * scale }; transform(); queueDraft(); }
  function renderVersions() { document.querySelector('#versionBadge').textContent = versions.length ? versions[0].version : 'V1.0'; document.querySelector('#versionList').innerHTML = versions.length ? versions.map((version, index) => `<article class="version-item"><b>${version.version}${index === 0 ? ' · 当前版本' : ''}</b><span>${new Date(version.publishedAt).toLocaleString('zh-CN')} · ${version.nodes.length} 个节点</span><small>✓ 已发布，只读快照</small></article>`).join('') : '<div class="version-empty">尚未发布正式版本。<br>当前变化仅存在于自动草稿中。</div>'; }
  function publish() { const latest = versions[0]?.version?.match(/^V(\d+)\.(\d+)$/); const version = latest ? `V${latest[1]}.${Number(latest[2]) + 1}` : 'V1.0'; versions.unshift({ version, publishedAt: Date.now(), name: state.name, nodes: deep(state.nodes.map(node => ({ ...node, status: 'idle' }))), edges: deep(state.edges) }); localStorage.setItem(activeVersionsKey, JSON.stringify(versions)); renderVersions(); queueDraft(); showToast(`画布已发布为 ${version}`); }
  function toggleLibrary(force) { const open = force ?? !palette.classList.contains('open'); palette.classList.toggle('open', open); palette.setAttribute('aria-hidden', String(!open)); const trigger = document.querySelector('#openNodeLibrary'); trigger.classList.toggle('active', open); trigger.setAttribute('aria-expanded', String(open)); if (!open) { const search = document.querySelector('#workflowNodeSearch'); search.value = ''; document.querySelectorAll('.workflow-node-option').forEach(button => button.style.display = 'flex'); document.querySelectorAll('.workflow-category').forEach(group => group.style.display = 'block'); } }
  function applySnapshot(data) { state = { ...state, ...deep(data) }; selectedId = null; renderAll(); queueDraft(); }
  function loadWorkflow({ id = 'primary', name = '未命名音乐工作流', version = 'V1.0', published = false } = {}) {
    clearTimeout(saveTimer); persistDraft();
    activeWorkflowId = id;
    activeDraftKey = storageKey(BASE_DRAFT_KEY, activeWorkflowId);
    activeVersionsKey = storageKey(BASE_VERSIONS_KEY, activeWorkflowId);
    state = parse(localStorage.getItem(activeDraftKey), null) || { ...defaultState(), name };
    if (state.schemaVersion !== 9) state = { ...defaultState(), name };
    state.nodes.forEach(node => node.status = 'idle');
    versions = parse(localStorage.getItem(activeVersionsKey), []);
    if (!versions.length && published) { versions = [{ version, publishedAt: Date.now(), name: state.name, nodes: deep(state.nodes), edges: deep(state.edges) }]; localStorage.setItem(activeVersionsKey, JSON.stringify(versions)); }
    selectedId = null; pending = null; portDragging = null; dragging = null; panning = null; undo = []; redo = [];
    document.querySelector('#versionPanel').classList.remove('open');
    renderAll(); queueDraft();
  }
  function copyWorkflow(sourceId, targetId, name) {
    const sourceDraft = parse(localStorage.getItem(storageKey(BASE_DRAFT_KEY, sourceId)), null);
    if (sourceDraft) localStorage.setItem(storageKey(BASE_DRAFT_KEY, targetId), JSON.stringify({ ...deep(sourceDraft), name, updatedAt: Date.now() }));
    localStorage.removeItem(storageKey(BASE_VERSIONS_KEY, targetId));
  }
  function publishedSnapshotNodes(snapshot) {
    const executable=(snapshot.nodes||[]).filter(node=>!String(node.type||'').endsWith('Menu'));
    const nodeMap=new Map(executable.map(node=>[node.id,node])),indegree=new Map(executable.map(node=>[node.id,0])),outgoing=new Map(executable.map(node=>[node.id,[]]));
    (snapshot.edges||[]).filter(edge=>edge.edgeType==='control'&&nodeMap.has(edge.from)&&nodeMap.has(edge.to)).forEach(edge=>{indegree.set(edge.to,indegree.get(edge.to)+1);outgoing.get(edge.from).push(edge.to)});
    const positionSort=(a,b)=>(Number(a.y)||0)-(Number(b.y)||0)||(Number(a.x)||0)-(Number(b.x)||0),queue=executable.filter(node=>indegree.get(node.id)===0).sort(positionSort),ordered=[];
    while(queue.length){const node=queue.shift();ordered.push(node);outgoing.get(node.id).forEach(id=>{indegree.set(id,indegree.get(id)-1);if(indegree.get(id)===0){queue.push(nodeMap.get(id));queue.sort(positionSort)}})}
    executable.filter(node=>!ordered.includes(node)).sort(positionSort).forEach(node=>ordered.push(node));
    return ordered.map(node=>({id:node.id,type:node.type,title:node.title||defs[node.type]?.title||'未命名节点',subtitle:defs[node.type]?.subtitle||'工作流节点',category:defs[node.type]?.category||'song'}));
  }
  function getPublishedSnapshot(workflowId,version){const stored=parse(localStorage.getItem(storageKey(BASE_VERSIONS_KEY,workflowId)),[]),storedExact=stored.find(item=>item.version===version),builtInExact=(builtInPublishedSnapshots[workflowId]||[]).find(item=>item.version===version),snapshot=storedExact?.nodes?.length?storedExact:(builtInExact||storedExact);if(!snapshot)return null;return {workflowId,version:snapshot.version,name:snapshot.name||'',publishedAt:snapshot.publishedAt||0,nodes:publishedSnapshotNodes(snapshot)}}
  window.orchestraWorkflowCanvas = { open: loadWorkflow, copy: copyWorkflow, getPublishedSnapshot };

  nodeLayer.addEventListener('click', event => {
    const element = event.target.closest('.flow-node'); if (!element) return; const id = element.dataset.id;
    if (event.target.closest('.node-remove')) return deleteNode(id);
    const choice = event.target.closest('[data-switch-type]'); if (choice) return changeType(id, choice.dataset.switchType);
    const back = event.target.closest('[data-back-category]'); if (back) return changeType(id, back.dataset.backCategory === 'lyrics' ? 'lyricsMenu' : 'songMenu');
    const port = event.target.closest('.node-port'); if (port) return connect(id, port.dataset.port, port);
    if (event.target.closest('.workflow-run')) return runNode(id);
    selectNode(id);
  });
  nodeLayer.addEventListener('pointerdown', event => {
    const port = event.target.closest('.node-port.output');
    const element = event.target.closest('.flow-node');
    if (!port || !element) return;
    event.preventDefault();
    event.stopPropagation();
    portDragging = { startX: event.clientX, startY: event.clientY, moved: false };
    connect(element.dataset.id, 'output', port);
  });
  nodeLayer.addEventListener('input', event => { const element = event.target.closest('.flow-node'), fieldName = event.target.dataset.field; if (!element || !fieldName) return; const node = nodeById(element.dataset.id); node.data ||= {}; node.data[fieldName] = event.target.value; if (node.type === 'writeLyrics') node.result = `${node.data.title || '未命名'} · ${node.data.lyrics || ''}`; if (node.type === 'textInput') node.result = node.data.text || ''; queueDraft(); });
  nodeLayer.addEventListener('change', event => { const element = event.target.closest('.flow-node'); if (!element) return; const node = nodeById(element.dataset.id); if (event.target.matches('.song-upload,.audio-upload')) { node.data ||= {}; node.data.fileName = event.target.files?.[0]?.name || ''; node.status = node.data.fileName ? 'success' : 'idle'; renderNodes(); queueDraft(); return; } if (event.target.dataset.field) { node.data ||= {}; node.data[event.target.dataset.field] = event.target.value; queueDraft(); } });
  document.addEventListener('pointermove', event => { if (portDragging && Math.hypot(event.clientX - portDragging.startX, event.clientY - portDragging.startY) > 4) portDragging.moved = true; if (dragging) { const node = nodeById(dragging.id); if (node) { node.x = Math.max(0, dragging.x + (event.clientX - dragging.clientX) / state.scale); node.y = Math.max(0, dragging.y + (event.clientY - dragging.clientY) / state.scale); const element = nodeLayer.querySelector(`[data-id="${node.id}"]`); if (element) { element.style.left = `${node.x}px`; element.style.top = `${node.y}px`; } drawEdges(); } } if (panning) { state.pan.x = panning.x + event.clientX - panning.clientX; state.pan.y = panning.y + event.clientY - panning.clientY; transform(); } });
  document.addEventListener('pointerup', event => { if (portDragging?.moved) { const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.node-port.input'); const targetNode = target?.closest('.flow-node'); if (target && targetNode) connect(targetNode.dataset.id, 'input', target); else { clearPendingConnection(); showToast('请将连线拖到有效的输入端口', 'error'); } } portDragging = null; if (dragging || panning) queueDraft(); dragging = null; panning = null; stage.classList.remove('panning'); });
  stage.addEventListener('pointerdown', event => { if (event.target.closest('.flow-node,.canvas-action-dock,.canvas-legend')) return; toggleLibrary(false); clearSelection(); panning = { clientX: event.clientX, clientY: event.clientY, x: state.pan.x, y: state.pan.y }; stage.classList.add('panning'); });
  stage.addEventListener('wheel', event => { event.preventDefault(); setZoom(state.scale * (event.deltaY > 0 ? .92 : 1.08), { x: event.clientX, y: event.clientY }); }, { passive: false });
  stage.addEventListener('dragover', event => event.preventDefault());
  stage.addEventListener('drop', event => { event.preventDefault(); const type = event.dataTransfer.getData('text/node-type'); if (!defs[type]) return; const rect = stage.getBoundingClientRect(); addNode(type, (event.clientX - rect.left - state.pan.x) / state.scale, (event.clientY - rect.top - state.pan.y) / state.scale); });
  stage.addEventListener('keydown', event => { if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); deleteNode(); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); document.querySelector(event.shiftKey ? '#redoCanvas' : '#undoCanvas').click(); } });
  document.querySelectorAll('.palette-node').forEach(button => { button.onclick = () => addNode(button.dataset.nodeType); button.ondragstart = event => { event.dataTransfer.setData('text/node-type', button.dataset.nodeType); event.dataTransfer.effectAllowed = 'copy'; }; });
  document.querySelector('#workflowNodeSearch').oninput = event => { const keyword = event.target.value.trim().toLowerCase(); document.querySelectorAll('.workflow-node-option').forEach(button => { button.style.display = button.textContent.toLowerCase().includes(keyword) ? 'flex' : 'none'; }); document.querySelectorAll('.workflow-category').forEach(group => { group.style.display = [...group.querySelectorAll('.workflow-node-option')].some(button => button.style.display !== 'none') ? 'block' : 'none'; }); };
  document.querySelector('#openNodeLibrary').onclick = () => toggleLibrary(); document.querySelector('#paletteCollapse').onclick = () => toggleLibrary(false);
  document.querySelector('#runAll').onclick = runAll;
  document.querySelector('#zoomIn').onclick = () => setZoom(state.scale + .1, canvasCenter()); document.querySelector('#zoomOut').onclick = () => setZoom(state.scale - .1, canvasCenter()); document.querySelector('#zoomReset').onclick = () => setZoom(1, canvasCenter()); document.querySelector('#fitCanvas').onclick = fitCanvas;
  document.querySelector('#undoCanvas').onclick = () => { if (undo.length) { redo.push(snapshot()); applySnapshot(undo.pop()); } else showToast('暂无可撤销的操作', 'error'); }; document.querySelector('#redoCanvas').onclick = () => { if (redo.length) { undo.push(snapshot()); applySnapshot(redo.pop()); } else showToast('暂无可恢复的操作', 'error'); };
  document.querySelector('#canvasTitle').oninput = event => { state.name = event.target.value; queueDraft(); };
  document.querySelector('#publishCanvas').onclick = publish; document.querySelector('#historyToggle').onclick = () => document.querySelector('#versionPanel').classList.add('open'); document.querySelector('#closeHistory').onclick = () => document.querySelector('#versionPanel').classList.remove('open'); document.querySelector('#backProjects').onclick = () => switchPage(typeof getCanvasReturnPage === 'function' ? getCanvasReturnPage() : 'projects');
  const observer = new MutationObserver(() => { if (document.querySelector('#canvasPage').classList.contains('active') && !state.nodes.length) setTimeout(() => toggleLibrary(true), 180); }); observer.observe(document.querySelector('#canvasPage'), { attributes: true, attributeFilter: ['class'] });
  renderAll(); queueDraft();
})();
