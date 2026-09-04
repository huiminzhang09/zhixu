(() => {
  const DRAFT_KEY = 'orchestra-workflow-draft-v1';
  const VERSIONS_KEY = 'orchestra-workflow-versions-v1';
  const NODE_W = 210;
  const NODE_H = 112;
  const typeMap = {
    prompt: { title: '文本输入', subtitle: '输入节点', symbol: 'T', color: '#8157ef', preview: '输入创作文本与提示词' },
    compose: { title: '歌曲生成', subtitle: '生成节点', symbol: '⌁', color: '#dc5798', preview: 'Orchestra Music 2.0 · 完整歌曲' },
    lyrics: { title: '歌词生成', subtitle: '生成节点', symbol: '✎', color: '#e58a3e', preview: '主歌 / 副歌 / 桥段' },
    mix: { title: '混音处理', subtitle: '处理节点', symbol: '≋', color: '#32aa80', preview: '均衡 · 压缩 · 空间混响' },
    output: { title: '导出音乐', subtitle: '输出节点', symbol: '⇥', color: '#8552dc', preview: 'WAV · 48kHz · 24bit' }
  };
  const defaultState = () => ({
    schemaVersion: 4, name: '未命名音乐工作流', scale: .9, pan: { x: 95, y: 100 }, updatedAt: Date.now(),
    nodes: [
      { id: 'node-prompt', type: 'prompt', x: 90, y: 150, title: '文本输入', description: '输入歌曲主题与风格', strength: 72, status: 'idle' },
      { id: 'node-lyrics', type: 'lyrics', x: 430, y: 150, title: '歌词生成', description: '生成歌曲歌词', strength: 76, status: 'idle' },
      { id: 'node-compose', type: 'compose', x: 780, y: 150, title: '歌曲生成', description: '生成完整歌曲', strength: 78, status: 'idle' }
    ],
    edges: [
      { id: 'edge-control-1', type: 'control', from: 'node-prompt', to: 'node-lyrics' },
      { id: 'edge-data-1', type: 'data', from: 'node-prompt', to: 'node-lyrics' },
      { id: 'edge-control-2', type: 'control', from: 'node-lyrics', to: 'node-compose' },
      { id: 'edge-data-2', type: 'data', from: 'node-lyrics', to: 'node-compose' }
    ]
  });
  const safeParse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
  let state = safeParse(localStorage.getItem(DRAFT_KEY), null) || defaultState();
  if (state.schemaVersion !== 4) state = defaultState();
  state.nodes ||= [];
  state.edges ||= [];
  state.pan ||= { x: 95, y: 100 };
  state.scale ||= .9;
  state.nodes.forEach(node => node.status = 'idle');
  let versions = safeParse(localStorage.getItem(VERSIONS_KEY), []);
  let selectedId = null;
  let pendingConnection = null;
  let dragState = null;
  let panState = null;
  let draftTimer = null;
  let undoStack = [];
  let redoStack = [];

  const stage = document.querySelector('#canvasStage');
  const viewport = document.querySelector('#canvasViewport');
  const nodeLayer = document.querySelector('#nodeLayer');
  const edgeLayer = document.querySelector('#edgeLayer');
  const inspector = document.querySelector('#nodeInspector');
  const inspectorEmpty = document.querySelector('#inspectorEmpty');
  const inspectorContent = document.querySelector('#inspectorContent');
  const cloneState = () => JSON.parse(JSON.stringify({ schemaVersion: 4, nodes: state.nodes, edges: state.edges, name: state.name, pan: state.pan, scale: state.scale }));
  const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const pushUndo = () => { undoStack.push(cloneState()); if (undoStack.length > 40) undoStack.shift(); redoStack = []; };

  function applySnapshot(snapshot) {
    state = { ...state, ...JSON.parse(JSON.stringify(snapshot)) };
    selectedId = null;
    renderAll();
    queueDraft();
  }
  function transformCanvas() {
    viewport.style.transform = `translate(${state.pan.x}px,${state.pan.y}px) scale(${state.scale})`;
    document.querySelector('#zoomValue').textContent = `${Math.round(state.scale * 100)}%`;
  }
  function edgePath(a, b, edgeType) {
    const offset = edgeType === 'control' ? 42 : 78;
    const x1 = a.x + NODE_W, y1 = a.y + offset, x2 = b.x, y2 = b.y + offset;
    const curve = Math.max(70, Math.abs(x2 - x1) * .5);
    return `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`;
  }
  function drawEdges() {
    edgeLayer.innerHTML = state.edges.map(edge => {
      const from = state.nodes.find(n => n.id === edge.from);
      const to = state.nodes.find(n => n.id === edge.to);
      if (!from || !to) return '';
      const edgeType = edge.type || 'data';
      const path = edgePath(from, to, edgeType);
      const running = from.status === 'running' || to.status === 'running';
      return `<g data-edge="${edge.id}" data-edge-type="${edgeType}"><path class="edge-bg ${edgeType}" d="${path}"></path><path class="edge ${edgeType} ${running ? 'running' : ''}" d="${path}"></path></g>`;
    }).join('');
  }
  function nodeTemplate(node) {
    const type = typeMap[node.type] || typeMap.compose;
    return `<article class="flow-node ${selectedId === node.id ? 'selected' : ''} ${node.status || ''}" data-id="${node.id}" style="left:${node.x}px;top:${node.y}px;--node-color:${type.color}">
      <button class="node-port input control" data-port="input" data-edge-type="control" aria-label="控制输入端口"></button>
      <button class="node-port input data" data-port="input" data-edge-type="data" aria-label="数据输入端口"></button>
      <header class="node-head"><span class="node-symbol">${type.symbol}</span><div class="node-title"><b>${node.title}</b><small>${type.subtitle}</small></div><i class="node-status"></i><button class="node-remove" aria-label="删除节点">×</button></header>
      <div class="node-body"><div class="node-preview">${type.preview}</div><div class="node-meta"><span>${node.status === 'success' ? '运行成功' : node.status === 'running' ? '运行中…' : '等待运行'}</span><button class="node-run">▶ 运行</button></div></div>
      <button class="node-port output control" data-port="output" data-edge-type="control" aria-label="控制输出端口"></button>
      <button class="node-port output data" data-port="output" data-edge-type="data" aria-label="数据输出端口"></button>
    </article>`;
  }
  function renderNodes() {
    nodeLayer.innerHTML = state.nodes.map(nodeTemplate).join('');
    document.querySelector('#canvasEmptyHint').classList.toggle('show', !state.nodes.length);
    bindNodeEvents();
    drawEdges();
    syncInspector();
  }
  function renderAll() {
    document.querySelector('#canvasTitle').value = state.name;
    transformCanvas();
    renderNodes();
    renderVersions();
  }
  function bindNodeEvents() {
    nodeLayer.querySelectorAll('.flow-node').forEach(element => {
      const node = state.nodes.find(item => item.id === element.dataset.id);
      element.addEventListener('pointerdown', event => {
        if (event.target.closest('button')) return;
        event.stopPropagation();
        selectNode(node.id);
        pushUndo();
        dragState = { id: node.id, startX: event.clientX, startY: event.clientY, nodeX: node.x, nodeY: node.y };
        element.setPointerCapture?.(event.pointerId);
      });
    });
  }
  function selectNode(nodeId) {
    selectedId = nodeId;
    nodeLayer.querySelectorAll('.flow-node').forEach(node => node.classList.toggle('selected', node.dataset.id === nodeId));
    syncInspector();
  }
  function clearSelection() {
    selectedId = null;
    nodeLayer.querySelectorAll('.flow-node').forEach(node => node.classList.remove('selected'));
    syncInspector();
  }
  function syncInspector() {
    const node = state.nodes.find(item => item.id === selectedId);
    inspector.classList.toggle('has-selection', !!node);
    inspectorEmpty.style.display = node ? 'none' : 'grid';
    inspectorContent.classList.toggle('show', !!node);
    if (!node) return;
    document.querySelector('#inspectorNodeType').textContent = typeMap[node.type].title;
    document.querySelector('#nodeNameInput').value = node.title;
    document.querySelector('#nodeDescription').value = node.description || '';
    document.querySelector('#nodeStrength').value = node.strength ?? 72;
    document.querySelector('#strengthValue').textContent = node.strength ?? 72;
  }
  function queueDraft() {
    const stateBox = document.querySelector('.draft-state');
    const label = document.querySelector('#draftStatus');
    stateBox.classList.add('saving');
    label.textContent = '正在保存草稿…';
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      state.updatedAt = Date.now();
      const draft = { ...state, nodes: state.nodes.map(node => ({ ...node, status: 'idle' })) };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      stateBox.classList.remove('saving');
      label.textContent = `草稿已自动保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }, 260);
  }
  function addNode(type, x, y) {
    pushUndo();
    const definition = typeMap[type];
    const count = state.nodes.filter(node => node.type === type).length + 1;
    const rect = stage.getBoundingClientRect();
    const node = {
      id: makeId('node'), type,
      x: Math.max(10, x ?? ((rect.width / 2 - state.pan.x) / state.scale - NODE_W / 2)),
      y: Math.max(10, y ?? ((rect.height / 2 - state.pan.y) / state.scale - NODE_H / 2)),
      title: count > 1 ? `${definition.title} ${count}` : definition.title,
      description: '', strength: 72, status: 'idle'
    };
    state.nodes.push(node);
    renderNodes();
    selectNode(node.id);
    queueDraft();
    showToast(`已添加「${definition.title}」节点`);
  }
  function deleteNode(nodeId = selectedId) {
    if (!nodeId) return;
    pushUndo();
    state.nodes = state.nodes.filter(node => node.id !== nodeId);
    state.edges = state.edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId);
    if (selectedId === nodeId) selectedId = null;
    renderNodes();
    queueDraft();
    showToast('节点已删除');
  }
  function handlePort(nodeId, kind, port) {
    const edgeType = port.dataset.edgeType;
    if (kind === 'output') {
      pendingConnection = { nodeId, edgeType };
      nodeLayer.querySelectorAll('.node-port').forEach(item => item.classList.remove('pending'));
      port.classList.add('pending');
      showToast(`请选择${edgeType === 'control' ? '控制' : '数据'}输入端口`);
      return;
    }
    if (kind === 'input' && pendingConnection && pendingConnection.nodeId !== nodeId) {
      if (pendingConnection.edgeType !== edgeType) { showToast('控制端口与数据端口不能混连'); return; }
      if (!state.edges.some(edge => edge.from === pendingConnection.nodeId && edge.to === nodeId && (edge.type || 'data') === edgeType)) {
        pushUndo();
        state.edges.push({ id: makeId('edge'), type: edgeType, from: pendingConnection.nodeId, to: nodeId });
        queueDraft();
      }
      pendingConnection = null;
      renderNodes();
    }
  }
  async function runNode(nodeId, quiet = false) {
    const node = state.nodes.find(item => item.id === nodeId);
    if (!node) return;
    node.status = 'running';
    renderNodes();
    await new Promise(resolve => setTimeout(resolve, 650 + Math.random() * 450));
    node.status = 'success';
    renderNodes();
    if (!quiet) showToast(`「${node.title}」运行成功`);
  }
  async function runAll() {
    const button = document.querySelector('#runAll');
    button.disabled = true;
    for (const node of state.nodes) await runNode(node.id, true);
    button.disabled = false;
    showToast('画布运行完成');
  }
  function setZoom(next, anchor) {
    const old = state.scale;
    next = Math.max(.35, Math.min(1.8, next));
    if (anchor) {
      const rect = stage.getBoundingClientRect();
      const ax = anchor.x - rect.left, ay = anchor.y - rect.top;
      const contentX = (ax - state.pan.x) / old, contentY = (ay - state.pan.y) / old;
      state.pan.x = ax - contentX * next;
      state.pan.y = ay - contentY * next;
    }
    state.scale = next;
    transformCanvas();
    queueDraft();
  }
  function fitCanvas() {
    if (!state.nodes.length) { state.pan = { x: 80, y: 80 }; setZoom(.9); return; }
    const rect = stage.getBoundingClientRect();
    const minX = Math.min(...state.nodes.map(n => n.x)), minY = Math.min(...state.nodes.map(n => n.y));
    const maxX = Math.max(...state.nodes.map(n => n.x + NODE_W)), maxY = Math.max(...state.nodes.map(n => n.y + NODE_H));
    const scale = Math.max(.35, Math.min(1.15, (rect.width - 120) / (maxX - minX), (rect.height - 120) / (maxY - minY)));
    state.scale = scale;
    state.pan = { x: (rect.width - (maxX - minX) * scale) / 2 - minX * scale, y: (rect.height - (maxY - minY) * scale) / 2 - minY * scale };
    transformCanvas();
    queueDraft();
  }
  function renderVersions() {
    const list = document.querySelector('#versionList');
    document.querySelector('#versionBadge').textContent = versions.length ? versions[0].version : 'V1.0';
    list.innerHTML = versions.length ? versions.map((version, index) => `<article class="version-item"><b>${version.version}${index === 0 ? ' · 当前版本' : ''}</b><span>${new Date(version.publishedAt).toLocaleString('zh-CN')} · ${version.nodes.length} 个节点</span><small>✓ 已发布，只读快照</small></article>`).join('') : '<div class="version-empty">尚未发布正式版本。<br>当前所有变化仅存在于自动保存的草稿中。</div>';
  }
  function publishCanvas() {
    queueDraft();
    const version = `V1.${versions.length}`;
    const snapshot = { version, publishedAt: Date.now(), name: state.name, nodes: JSON.parse(JSON.stringify(state.nodes.map(node => ({ ...node, status: 'idle' })))), edges: JSON.parse(JSON.stringify(state.edges)) };
    versions.unshift(snapshot);
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    renderVersions();
    showToast(`画布已发布为 ${version}`);
  }

  document.addEventListener('pointermove', event => {
    if (dragState) {
      const node = state.nodes.find(item => item.id === dragState.id);
      if (node) {
        node.x = Math.max(0, dragState.nodeX + (event.clientX - dragState.startX) / state.scale);
        node.y = Math.max(0, dragState.nodeY + (event.clientY - dragState.startY) / state.scale);
        const element = nodeLayer.querySelector(`[data-id="${node.id}"]`);
        if (element) { element.style.left = `${node.x}px`; element.style.top = `${node.y}px`; }
        drawEdges();
      }
    }
    if (panState) {
      state.pan.x = panState.x + event.clientX - panState.clientX;
      state.pan.y = panState.y + event.clientY - panState.clientY;
      transformCanvas();
    }
  });
  nodeLayer.addEventListener('click', event => {
    const nodeElement = event.target.closest('.flow-node');
    if (!nodeElement) return;
    const nodeId = nodeElement.dataset.id;
    const remove = event.target.closest('.node-remove');
    const run = event.target.closest('.node-run');
    const port = event.target.closest('.node-port');
    if (remove) { event.stopPropagation(); deleteNode(nodeId); return; }
    if (run) { event.stopPropagation(); runNode(nodeId); return; }
    if (port) { event.stopPropagation(); handlePort(nodeId, port.dataset.port, port); return; }
    selectNode(nodeId);
  });
  document.addEventListener('pointerup', () => {
    if (dragState || panState) queueDraft();
    dragState = null; panState = null; stage.classList.remove('panning');
  });
  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('.flow-node,.canvas-toolbar,.zoom-controls,.canvas-legend')) return;
    toggleNodeLibrary(false);
    clearSelection();
    panState = { clientX: event.clientX, clientY: event.clientY, x: state.pan.x, y: state.pan.y };
    stage.classList.add('panning');
  });
  stage.addEventListener('wheel', event => { event.preventDefault(); setZoom(state.scale * (event.deltaY > 0 ? .92 : 1.08), { x: event.clientX, y: event.clientY }); }, { passive: false });
  stage.addEventListener('dragover', event => event.preventDefault());
  stage.addEventListener('drop', event => {
    event.preventDefault();
    const type = event.dataTransfer.getData('text/node-type');
    if (!typeMap[type]) return;
    const rect = stage.getBoundingClientRect();
    addNode(type, (event.clientX - rect.left - state.pan.x) / state.scale, (event.clientY - rect.top - state.pan.y) / state.scale);
    toggleNodeLibrary(false);
  });
  stage.addEventListener('keydown', event => {
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); deleteNode(); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); document.querySelector(event.shiftKey ? '#redoCanvas' : '#undoCanvas').click(); }
  });
  document.querySelectorAll('.palette-node').forEach(button => {
    button.onclick = () => { addNode(button.dataset.nodeType); toggleNodeLibrary(false); };
    button.ondragstart = event => { event.dataTransfer.setData('text/node-type', button.dataset.nodeType); event.dataTransfer.effectAllowed = 'copy'; };
  });
  document.querySelector('#nodeSearch').oninput = event => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll('.palette-node').forEach(node => node.style.display = node.innerText.toLowerCase().includes(query) ? 'flex' : 'none');
  };
  document.querySelector('#deleteNode').onclick = () => deleteNode();
  document.querySelector('#runAll').onclick = runAll;
  document.querySelector('#inspectorRun').onclick = () => selectedId && runNode(selectedId);
  document.querySelector('#zoomIn').onclick = () => setZoom(state.scale + .1);
  document.querySelector('#zoomOut').onclick = () => setZoom(state.scale - .1);
  document.querySelector('#zoomReset').onclick = () => setZoom(1);
  document.querySelector('#fitCanvas').onclick = fitCanvas;
  document.querySelector('#selectTool').onclick = () => { document.querySelector('#selectTool').classList.add('active'); document.querySelector('#panTool').classList.remove('active'); };
  document.querySelector('#panTool').onclick = () => { document.querySelector('#panTool').classList.add('active'); document.querySelector('#selectTool').classList.remove('active'); };
  document.querySelector('#undoCanvas').onclick = () => { if (undoStack.length) { redoStack.push(cloneState()); applySnapshot(undoStack.pop()); } };
  document.querySelector('#redoCanvas').onclick = () => { if (redoStack.length) { undoStack.push(cloneState()); applySnapshot(redoStack.pop()); } };
  document.querySelector('#canvasTitle').oninput = event => { state.name = event.target.value; queueDraft(); };
  document.querySelector('#nodeNameInput').oninput = event => {
    const node = state.nodes.find(item => item.id === selectedId);
    if (node) { node.title = event.target.value; const title = nodeLayer.querySelector(`[data-id="${node.id}"] .node-title b`); if (title) title.textContent = node.title; queueDraft(); }
  };
  document.querySelector('#nodeDescription').oninput = event => { const node = state.nodes.find(item => item.id === selectedId); if (node) { node.description = event.target.value; queueDraft(); } };
  document.querySelector('#nodeStrength').oninput = event => { document.querySelector('#strengthValue').textContent = event.target.value; const node = state.nodes.find(item => item.id === selectedId); if (node) { node.strength = +event.target.value; queueDraft(); } };
  document.querySelector('#closeInspector').onclick = clearSelection;
  function toggleNodeLibrary(force) {
    const palette = document.querySelector('#nodePalette');
    const open = force ?? !palette.classList.contains('open');
    palette.classList.toggle('open', open);
    palette.setAttribute('aria-hidden', String(!open));
    document.querySelector('#openNodeLibrary').classList.toggle('active', open);
    if (open) setTimeout(() => document.querySelector('#nodeSearch').focus(), 180);
  }
  document.querySelector('#paletteCollapse').onclick = () => toggleNodeLibrary(false);
  document.querySelector('#openNodeLibrary').onclick = () => toggleNodeLibrary();
  document.querySelector('#publishCanvas').onclick = publishCanvas;
  document.querySelector('#historyToggle').onclick = () => document.querySelector('#versionPanel').classList.add('open');
  document.querySelector('#closeHistory').onclick = () => document.querySelector('#versionPanel').classList.remove('open');
  document.querySelector('#backProjects').onclick = () => switchPage('projects');
  renderAll();
  queueDraft();
})();
