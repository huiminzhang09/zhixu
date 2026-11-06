(() => {
  const BASE_DRAFT_KEY = 'orchestra-september-workflow-draft';
  const BASE_VERSIONS_KEY = 'orchestra-september-workflow-versions';
  const storageKey = (base, workflowId) => workflowId === 'primary' ? base : `${base}:${workflowId}`;
  let activeWorkflowId = 'primary';
  let readOnly = false;
  let appliedReadOnly = null;
  let activeDraftKey = storageKey(BASE_DRAFT_KEY, activeWorkflowId);
  let activeVersionsKey = storageKey(BASE_VERSIONS_KEY, activeWorkflowId);
  const NODE_W = 340;
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
    playlistSong: { title: '基于歌单生成歌曲', subtitle: '歌曲节点', symbol: '单', color: '#8a5dd8', category: 'song' },
    workOutput: { title: '成品组装', subtitle: '组合资源并输出成品', symbol: '成', color: '#4aab91', category: 'output' }
  };
  const nodeIcons={"plus": "<path d=\"M12 4v16M4 12h16\"/>", "arrow": "<path d=\"m5 3 15 8-7 2-3 7-5-17Z\"/>", "hand": "<path d=\"M8 12V6a2 2 0 0 1 4 0v5-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v8c0 5-2 8-6 8h-1c-3 0-5-2-7-4l-4-5a2 2 0 0 1 3-3l3 3Z\"/>", "publish": "<path d=\"m21 3-6 18-4-8-8-4L21 3ZM11 13 21 3\"/>", "history": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 6v6l4 3\"/>", "materials": "<path d=\"m12 3 10 5-10 5L2 8l10-5ZM4 12l-2 1 10 5 10-5-2-1M4 17l-2 1 10 5 10-5-2-1\"/>", "finished": "<path d=\"M6 8V5h12v3M3 8h18l2 5H1l2-5ZM3 13v7h18v-7M9 16h6\"/>", "fit": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"4\"/><path d=\"m8 8 8 8M8 12V8h4M16 12v4h-4\"/>", "focus": "<path d=\"M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/>", "keyboard": "<rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M5 9h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1M7 16h10\"/>", "undo": "<path d=\"m8 6-5 5 5 5M3 11h12a5 5 0 0 1 0 10\"/>", "redo": "<path d=\"m16 6 5 5-5 5M21 11H9a5 5 0 0 0 0 10\"/>", "edit": "<path d=\"m15 4 5 5M5 19l4-1L21 6l-4-4L5 14v5ZM12 3H5a3 3 0 0 0-3 3v13a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3v-7\"/>", "chevron": "<path d=\"m6 9 6 6 6-6\"/>", "check": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8 12 3 3 5-6\"/>", "close": "<path d=\"m6 6 12 12M18 6 6 18\"/>", "writeLyrics": "<path d=\"m15 3 5 5-10 10-6 1 1-6L15 3ZM14 4l5 5M4 22h15\"/>", "aiLyrics": "<path d=\"M14 3H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7M7 7h9M12 7v9M16 17l3-4 3 4-3 4-3-4Z\"/>", "refLyrics": "<path d=\"M15 3H5a2 2 0 0 0-2 2v15h11M15 3l4 4v5M7 7h5M7 11h8M7 15h5M17 15l3 3-3 3-3-3 3-3Z\"/>", "aiSong": "<path d=\"M9 17V5l9-2v11M9 9l9-2\"/><circle cx=\"5\" cy=\"18\" r=\"4\"/><circle cx=\"14\" cy=\"15\" r=\"4\"/><path d=\"m20 17 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z\"/>", "refSong": "<rect x=\"3\" y=\"3\" width=\"17\" height=\"16\" rx=\"3\"/><path d=\"M12 7v7m0-7 4 2\"/><circle cx=\"9\" cy=\"14\" r=\"3\"/><path d=\"m17 17 3 3-3 3-3-3 3-3Z\"/>", "sampleSong": "<path d=\"M13 2H5a2 2 0 0 0-2 2v16h7M13 2l6 6h-6V2ZM17 13v6m0-6 4 2\"/><circle cx=\"14\" cy=\"19\" r=\"3\"/>", "playlistSong": "<rect x=\"6\" y=\"2\" width=\"16\" height=\"17\" rx=\"3\"/><path d=\"M3 6v14a2 2 0 0 0 2 2h13M15 6v8m0-8 4 1\"/><circle cx=\"12\" cy=\"14\" r=\"3\"/>", "rvc": "<path d=\"M3 8a9 9 0 0 1 16-3l2 3M21 3v5h-5M21 16a9 9 0 0 1-16 3l-2-3M3 21v-5h5M8 10v4m4-7v10m4-7v4\"/>", "svc": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M13 6v9l4-2M9 5l-4 4M5 5v4h4\"/>", "stemSplit": "<path d=\"M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M2 11h3l2-3 3 8 3-7 3 5 2-3h4\"/>", "audioMerge": "<rect x=\"2\" y=\"2\" width=\"13\" height=\"13\" rx=\"3\"/><path d=\"M9 18v2a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2M6 5v6m4-4v5m5 3v4m3-6v6\"/>", "loudness": "<path d=\"M5 3v8m0 6v4M12 3v3m0 6v9M19 3v10m0 6v2\"/><rect x=\"2\" y=\"11\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"9\" y=\"6\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"16\" y=\"13\" width=\"6\" height=\"6\" rx=\"1\"/>", "coverImage": "<rect x=\"2\" y=\"3\" width=\"18\" height=\"18\" rx=\"4\"/><circle cx=\"7\" cy=\"8\" r=\"2\"/><path d=\"m3 18 6-6 4 4 6-6M19 1v5m-2-2h5\"/>", "execution": "<path d=\"m5 15 4 4 4-4M9 19V5m0 0L5 9m4-4 4 4M16 8l3 3-3 3\"/>"};
  const icon=key=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${nodeIcons[key]||nodeIcons[{textInput:'refLyrics',audioUpload:'aiSong',uploadSong:'sampleSong',workOutput:'materials'}[key]]||nodeIcons.refLyrics}</svg>`;
  const html=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  Object.assign(defs,{
    rvc:{title:'RVC 音色转换',subtitle:'音频处理',category:'audio',color:'#ae9ad0'},
    svc:{title:'SVC 音色转换',subtitle:'音频处理',category:'audio',color:'#ae9ad0'},
    stemSplit:{title:'声伴分离',subtitle:'分离人声与伴奏',category:'audio',color:'#ae9ad0'},
    audioMerge:{title:'音轨合并',subtitle:'合并多个音频',category:'audio',color:'#ae9ad0'},
    loudness:{title:'音频响度调整',subtitle:'调整音频响度',category:'audio',color:'#ae9ad0'},
    coverImage:{title:'文字封面生成',subtitle:'封面图片',category:'image',color:'#c7b175'}
  });
  const paletteGroups=[['歌词',['writeLyrics','aiLyrics','refLyrics']],['歌曲',['aiSong','refSong','sampleSong','playlistSong']],['音频处理',['rvc','svc','stemSplit','audioMerge','loudness']],['图片',['coverImage']],['基础输入',['textInput','audioUpload','uploadSong']]];
  function renderPalette(){document.querySelector('#workflowNodeLibrary').innerHTML=paletteGroups.map(([label,types])=>`<section class="workflow-category"><header>${label}</header><div class="workflow-category-list">${types.map(type=>`<button type="button" class="palette-node workflow-node-option" draggable="true" data-node-type="${type}"><i>${icon(type)}</i><span>${defs[type].title}</span><em>＋</em></button>`).join('')}</div></section>`).join('');}
  let navigationMode='select',spacePanning=false;
  const builtInPublishedSnapshots = {
    'ai-lyrics-demo-production': [{ version: 'V1.0', name: 'AI歌词创作流程', publishedAt: Date.parse('2026-11-03T09:00:00+08:00'), nodes: [
      { id: 'ai-lyrics-demo-node', type: 'aiLyrics', title: 'AI生成歌词', x: 100, y: 100 },
      { id: 'ai-lyrics-demo-song', type: 'refSong', title: '基于参考生成歌曲', x: 460, y: 100 },
      { id: 'ai-lyrics-demo-output', type: 'workOutput', title: '成品组装', x: 820, y: 100 }
    ], edges: [
      { id: 'ai-lyrics-demo-edge-1', edgeType: 'control', from: 'ai-lyrics-demo-node', to: 'ai-lyrics-demo-song' },
      { id: 'ai-lyrics-demo-edge-2', edgeType: 'control', from: 'ai-lyrics-demo-song', to: 'ai-lyrics-demo-output' }
    ] }],
    'work-output-production': [{ version: 'V1.0', name: '词曲与成品组装流程', publishedAt: Date.parse('2026-10-21T10:00:00+08:00'), nodes: [
      { id: 'output-lyrics', type: 'refLyrics', x: 100, y: 100 },
      { id: 'output-song', type: 'refSong', x: 460, y: 100 },
      { id: 'output-work', type: 'workOutput', x: 820, y: 100 }
    ], edges: [
      { id: 'output-control-1', edgeType: 'control', from: 'output-lyrics', to: 'output-song' },
      { id: 'output-control-2', edgeType: 'control', from: 'output-song', to: 'output-work' }
    ] }],
    'midnight-melody': [{ version: 'V2.1', name: '午夜旋律', publishedAt: Date.parse('2026-09-01T14:25:00+08:00'), nodes: [
      { id: 'midnight-write-lyrics', type: 'writeLyrics', data:{title:'午夜旋律',lyrics:'末班车驶过街角，灯光照亮旧站台。'}, x: 100, y: 100 },
      { id: 'midnight-ai-song', type: 'aiSong', x: 460, y: 100 },
      { id: 'midnight-sample-song', type: 'sampleSong', x: 820, y: 100 }
    ], edges: [
      { id: 'midnight-control-1', edgeType: 'control', from: 'midnight-write-lyrics', to: 'midnight-ai-song' },
      { id: 'midnight-control-2', edgeType: 'control', from: 'midnight-ai-song', to: 'midnight-sample-song' }
    ] }],
    'reference-lab': [{ version: 'V1.0', name: '参考歌实验室', publishedAt: Date.parse('2026-08-24T12:25:00+08:00'), nodes: [
      { id: 'reference-text-input', type: 'textInput', x: 100, y: 100 },
      { id: 'reference-lyrics', type: 'refLyrics', data:{referenceLyrics:'潮声退去，海边的灯还亮着。',userPrompt:'以海边告别为主题，写两段温柔的中文歌词。',count:2}, x: 460, y: 100 },
      { id: 'reference-ai-song', type: 'aiSong', x: 820, y: 100 },
      { id: 'reference-song', type: 'refSong', x: 1180, y: 100 }
    ], edges: [
      { id: 'reference-control-1', edgeType: 'control', from: 'reference-text-input', to: 'reference-lyrics' },
      { id: 'reference-control-2', edgeType: 'control', from: 'reference-lyrics', to: 'reference-ai-song' },
      { id: 'reference-control-3', edgeType: 'control', from: 'reference-ai-song', to: 'reference-song' }
    ] }],
    'playlist-production': [{ version: 'V1.0', name: '歌单生成歌曲流程', publishedAt: Date.parse('2026-10-21T09:30:00+08:00'), nodes: [
      { id: 'playlist-reference-lyrics', type: 'refLyrics', title: '基于参考生成歌词', x: 100, y: 100 },
      { id: 'playlist-generate-song', type: 'playlistSong', title: '基于歌单生成歌曲', x: 460, y: 100 }
    ], edges: [
      { id: 'playlist-control-1', edgeType: 'control', from: 'playlist-reference-lyrics', to: 'playlist-generate-song' }
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
  state.nodes.forEach(node => {node.status = 'idle';node.data ||= {};if(readOnly){node.result='';node.runHistory=[];node.previewRun='';}});
  let versions = parse(localStorage.getItem(activeVersionsKey), []);
  let selectedId = null, pending = null, portDragging = null, dragging = null, panning = null, saveTimer = null;
  let undo = [], redo = [];

  const stage = document.querySelector('#canvasStage');
  const viewport = document.querySelector('#canvasViewport');
  const zoomLayer = document.querySelector('#canvasZoomLayer');
  const nodeLayer = document.querySelector('#nodeLayer');
  const portResizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>refreshPortPositions()):null;
  const edgeLayer = document.querySelector('#edgeLayer');
  const palette = document.querySelector('#nodePalette');
  const publishDialog = document.querySelector('#canvasPublishDialog');
  const publishError = document.querySelector('#canvasPublishError');
  const confirmPublishButton = document.querySelector('#confirmCanvasPublish');
  let publishContext = null;
  const deep = value => JSON.parse(JSON.stringify(value));
  const snapshot = () => deep({ schemaVersion: 9, name: state.name, scale: state.scale, pan: state.pan, nodes: state.nodes, edges: state.edges });
  const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const pushUndo = () => { undo.push(snapshot()); if (undo.length > 40) undo.shift(); redo = []; };
  const nodeById = id => state.nodes.find(node => node.id === id);
  const dataKindsMatch = (from, to) => from === to || (from === 'text' && to === 'lyrics') || (from === 'lyrics' && to === 'text') || (from === 'audio' && to === 'song') || (from === 'song' && to === 'audio');

  function portsFor(type) {
    const inputs = [], outputs = [];
    if (!type.endsWith('Menu')) {
      inputs.push({ key: 'control-in', edgeType: 'control', label: '控制', required: false });
      if (type !== 'workOutput') outputs.push({ key: 'control-out', edgeType: 'control', label: '控制', required: false });
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
    if (['rvc','svc','stemSplit','loudness'].includes(type)) { addInput('audio-in','audio','音频',true); addOutput('audio-out','audio','音频'); }
    if(type==='audioMerge'){addInput('audio-1-in','audio','音轨 1',true);addInput('audio-2-in','audio','音轨 2',true);addOutput('audio-out','audio','音频');}
    if(type==='coverImage'){addInput('text-in','text','封面文字');addOutput('image-out','image','图片');}
    return { inputs, outputs };
  }
  function portTop(port, index) {
    if (port.edgeType === 'control') return 74;
    return 110 + (index - 1) * 26;
  }
  function portMarkup(node, side) {
    const ports = portsFor(node.type)[side];
    return ports.map((port, index) => {
      const top = portTop(port, index);
      const direction = side === 'inputs' ? 'input' : 'output';
      const labelClass = side === 'inputs' ? 'input-label' : 'output-label';
      return `<button class="node-port ${direction} ${port.edgeType}" style="top:${top}px" type="button" data-port="${direction}" data-port-key="${port.key}" data-edge-type="${port.edgeType}" data-kind="${port.kind || ''}" aria-label="${port.label}${direction === 'input' ? '输入' : '输出'}端口"></button><span data-port-label="${port.key}" class="port-cluster-label ${labelClass} ${port.edgeType} ${port.required ? 'required' : ''}" style="top:${top - 6}px">${port.edgeType==='control'?(direction==='output'?'下一步':''):port.label}</span>`;
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
  const canvasTimbreTypes = new Set(['aiSong', 'refSong', 'playlistSong']);
  const canvasTimbreTeam = () => document.querySelector('.workspace-option.active')?.dataset.workspaceId || 'orchestra-studio';
  const canvasTimbreContext = () => JSON.stringify([activeWorkflowId, activeDraftKey, localStorage.getItem('orchestra-demo-account'), canvasTimbreTeam()]);
  function canvasTimbreName(node) {
    const id = String(node.data?.timbreId || '');
    if (!id) return '不指定音色';
    try {
      const item = window.orchestraMaterialLibrary?.listUsableTimbres(canvasTimbreTeam()).find(item => item.id === id);
      if (item) return item.name;
    } catch {}
    return node.data?.timbreName || '已选择的音色';
  }
  function canvasTimbreField(node) {
    if (!canvasTimbreTypes.has(node.type)) return '';
    const name = canvasTimbreName(node), selected = Boolean(node.data?.timbreId);
    return `<div class="node-field node-timbre-field"><span>音色 <i class="node-field-info" title="从音色库中选择生成成功的音色，支持按名称搜索。">ⓘ</i></span><button type="button" class="node-timbre-picker${selected ? ' has-selection' : ''}" data-pick-node-timbre aria-haspopup="dialog" aria-label="${selected ? '更换音色：' : '选择音色：'}${html(name)}" title="${html(name)}" ${readOnly ? 'disabled' : ''}><span>${html(selected ? name : '选择音色')}</span><i aria-hidden="true">${icon('aiSong')}</i></button></div>`;
  }
  function canvasNodeSummary(node) {
    const voice = canvasTimbreTypes.has(node.type) ? `<small class="node-summary-timbre" title="${html(canvasTimbreName(node))}">音色：${html(canvasTimbreName(node))}</small>` : '';
    const values = Object.entries(node.data || {}).filter(([key, value]) => !['timbreId', 'timbreName'].includes(key) && typeof value === 'string' && value.trim()).slice(0, voice ? 3 : 4);
    return voice + values.map(([, value]) => `<small>${html(value)}</small>`).join('');
  }
  function validateCanvasTimbre(node) {
    if (!canvasTimbreTypes.has(node.type) || !node.data?.timbreId) return true;
    try {
      const api = window.orchestraMaterialLibrary;
      if (!api?.listUsableTimbres) throw Error('音色库尚未就绪，请刷新后重试');
      if (!api.listUsableTimbres(canvasTimbreTeam()).some(item => item.id === node.data.timbreId)) throw Error('所选音色尚未生成成功或已不可用，请重新选择');
      return true;
    } catch (error) { showToast(error.message || '音色暂不可用，请重新选择', 'error'); return false; }
  }
  function pickCanvasTimbre(node) {
    if (readOnly || !node || !canvasTimbreTypes.has(node.type)) return;
    const api = window.orchestraMaterialLibrary, context = canvasTimbreContext(), type = node.type;
    if (!api?.openTimbrePicker) { showToast('音色库尚未就绪，请刷新后重试', 'error'); return; }
    api.openTimbrePicker({
      selectedId: node.data?.timbreId || '', team: canvasTimbreTeam(),
      onSelect: item => {
        if (readOnly || context !== canvasTimbreContext() || nodeById(node.id) !== node || node.type !== type) throw Error('当前画布或节点已变更，请重新选择音色');
        if (item && !api.listUsableTimbres(canvasTimbreTeam()).some(voice => voice.id === item.id)) throw Error('所选音色已不可用，请重新选择');
        pushUndo(); node.data ||= {};
        node.data.timbreId = item?.id || ''; node.data.timbreName = item?.name || '';
        renderNodes(); queueDraft();
      }
    });
  }
  const field=(node,key,label,options={})=>{
    const value=node.data?.[key]??options.default??'',required=options.required?'<em>必填</em>':'';
    const info=options.help?`<i class="node-field-info" title="${html(options.help)}" aria-label="${html(options.help)}">ⓘ</i>`:'';
    const attr=`data-field="${key}"`,head=`<span>${label}${required}${info}</span>`;
    const input=options.type==='textarea'?`<textarea ${attr} placeholder="${html(options.placeholder||'')}">${html(value)}</textarea>`:options.type==='select'?`<select ${attr}>${options.values.map(item=>`<option ${String(value)===String(item)?'selected':''}>${html(item)}</option>`).join('')}</select>`:`<input ${attr} value="${html(value)}" placeholder="${html(options.placeholder||'')}" />`;
    return `<label class="node-field${options.type==='select'?' inline-field':''}" ${options.port?`data-input-port="${options.port}"`:''}>${head}${input}</label>`;
  };
  function choices(node,key,label,values,initial){const value=node.data?.[key]??initial;return `<div class="node-field inline-field"><span>${label} <i class="node-field-info" title="本次运行生成的结果数量">ⓘ</i></span><div class="node-choice-group" role="group" aria-label="${label}">${values.map(item=>`<button type="button" data-choice-field="${key}" data-choice-value="${item}" class="${String(value)===String(item)?'active':''}" aria-pressed="${String(value)===String(item)}">${item}</button>`).join('')}</div></div>`;}
  function range(node,key,label,initial){const value=Number(node.data?.[key]??initial);return `<label class="node-field inline-field"><span>${label} <i class="node-field-info" title="调整${label}">ⓘ</i></span><span class="node-range"><input type="range" min="0" max="100" data-field="${key}" value="${value}" aria-label="${label}"><output>${value}%</output></span></label>`;}
  const moreButton=node=>`<button type="button" class="node-more-fields" data-toggle-fields aria-expanded="${!node.advancedCollapsed}">${node.advancedCollapsed?'展开':'收起'}更多字段 ${icon('chevron')}</button>`;
  const promptField=(node,key='prompt',label='提示词',required=false)=>field(node,key,label,{type:'textarea',required,placeholder:'描述创作要求、风格和情绪方向',help:'用于描述本次生成的创作要求'});
  function audioInput(node,port,label,required=false){const connected=state.edges.some(e=>e.to===node.id&&e.toPort===port),fileName=node.data?.[port+'File'];return `<div class="node-audio-field" data-input-port="${port}"><span>${label}${required?'<em>必填</em>':''}</span><label class="upload-drop"><input type="file" accept="audio/*" data-upload-port="${port}">${icon('aiSong')}<span><b>${html(fileName||(connected?'已连接上游音频':'上传音频或连接上游节点'))}</b><small>${connected?'运行时引用上游节点输出':'支持 MP3、WAV、M4A 等音频格式'}</small></span><strong>${fileName?'替换':'＋'}</strong></label></div>`;}
  function outputBlock(node){
    if(readOnly)return "";
    const outputs=portsFor(node.type).outputs.filter(p=>p.edgeType==='data');
    const historical=node.previewRun?(node.runHistory||[]).find(run=>String(run.number)===String(node.previewRun)):null;
    const result=historical?.result??node.result,kind=outputs[0]?.kind,hasResult=Boolean(result),audio=['song','audio'].includes(kind);
    const content=hasResult?(audio?`<p class="node-result-caption">${html(result)} · 演示音频</p><audio controls preload="none" src="./assets/reference-song-result-a.wav"></audio>`:kind==='image'?`<div class="node-cover-example"><span>${html(node.data?.coverText||'让灵感成为作品')}</span><small>封面示例</small></div>`:`<pre>${html(result)}</pre>`):(audio?`<div class="node-output-wave" aria-label="暂无音频输出">${Array.from({length:34},(_,i)=>`<i style="height:${12+(i*17%29)}px"></i>`).join('')}</div>`:`<span class="node-result-empty">${icon(kind==='image'?'coverImage':'refLyrics')} ${node.type==='writeLyrics'?'这次新运行尚未执行':kind==='image'?'暂无图片生成':'暂无歌词生成'}</span>`);
    return `<section class="node-output-section"><h3>输出</h3><p class="node-output-state">${hasResult?'本次运行已完成':'这次新运行尚未执行'}</p>${outputs.map((port,i)=>`<div class="node-output-anchor" data-output-port="${port.key}">${outputs.length>1?`<label>${port.label}</label>`:''}${i===outputs.length-1?`<div class="generation-output ${hasResult?'ready':''}">${content}</div>`:''}</div>`).join('')}<div class="node-run-row"><select class="node-run-history" data-run-version aria-label="选择运行记录"><option value="">◷ ${(node.runHistory?.length||0)+1}次新运行</option>${(node.runHistory||[]).map(run=>`<option value="${run.number}" ${historical?.number===run.number?'selected':''}>第 ${run.number} 次运行</option>`).reverse().join('')}</select><button type="button" class="workflow-run" ${node.status==='running'?'disabled':''}>▶ ${node.status==='running'?'运行中':'开始运行'}</button></div></section>`;
  }
  function nodeForm(node){
    if(node.type.endsWith('Menu'))return featureMenu(node);
    if(node.type==='workOutput')return '<p class="assembly-node-description">上游节点全部完成后，在待办中将输出与备选资源组装为成品。确认提交后，本次生产运行完成。</p>';
    let fields='';
    if(node.type==='textInput')fields=field(node,'text','文本内容',{required:true,type:'textarea',placeholder:'输入文本内容'});
    if(node.type==='writeLyrics')fields=field(node,'lyrics','歌词',{required:true,type:'textarea',placeholder:'填写完整歌词',help:'用户填写的完整歌词文本。'})+`<details class="node-optional-title"><summary>更多设置</summary>${field(node,'title','歌名',{placeholder:'输入歌名'})}</details>`;
    if(['audioUpload','uploadSong'].includes(node.type))fields=`<label class="upload-drop"><input class="${node.type==='audioUpload'?'audio-upload':'song-upload'}" type="file" accept="audio/*">${icon('aiSong')}<span><b>${html(node.data?.fileName||'点击上传音频')}</b><small>支持 MP3、WAV、M4A 等音频格式</small></span></label>`;
    if(['aiLyrics','refLyrics'].includes(node.type)){
      fields=(node.type==='refLyrics'?field(node,'referenceLyrics','参考歌词',{required:true,type:'textarea',placeholder:'填写参考歌词',port:'lyrics-in'}):'')+promptField(node,'userPrompt','用户提示词',true)+moreButton(node);
      if(!node.advancedCollapsed)fields+=choices(node,'count','生成数量',[1,2,3],1)+(node.type==='refLyrics'?field(node,'goldenLine','金句',{placeholder:'选填希望保留的金句'})+field(node,'rhyme','韵脚',{placeholder:'选填押韵方式'})+field(node,'avoid','规避词',{placeholder:'选填需要避免的词语'})+field(node,'imagery','意象',{placeholder:'选填意象关键词'})+field(node,'format','歌词格式',{placeholder:'选填歌词格式'}):'')+field(node,'systemPrompt','系统提示词',{placeholder:'选填补充创作要求'});
    }
    if(['aiSong','refSong','sampleSong','playlistSong'].includes(node.type)){
      if(['refSong','sampleSong'].includes(node.type))fields+=audioInput(node,'song-in','参考歌曲',true);
      if(node.type==='playlistSong')fields+=[1,2,3,4].map(i=>audioInput(node,`song-${i}-in`,`参考歌曲 ${i}`,i===1)).join('');
      fields+=canvasTimbreField(node)+moreButton(node)+field(node,'lyrics','歌词',{type:'textarea',placeholder:'填写歌词',port:'lyrics-in'})+promptField(node)+field(node,'title','标题',{placeholder:'选填歌曲标题'});
      if(!node.advancedCollapsed)fields+=promptField(node,'negative','反向提示词')+field(node,'model','模型版本',{type:'select',values:['Hawk（V6）','Music V4','Music V3.5','Fast'],default:'Hawk（V6）'})+choices(node,'count','生成数量',[2,4],2)+range(node,'styleStrength','风格强度',50)+range(node,'randomness','随机度',50)+field(node,'gender','人声性别',{type:'select',values:['不指定','男声','女声'],default:'不指定'})+field(node,'instrumental','生成纯音乐',{type:'select',values:['不指定','是','否'],default:'不指定'});
    }
    if(['rvc','svc'].includes(node.type))fields=audioInput(node,'audio-in','参考音频',true)+field(node,'voiceModel','模型',{required:true,placeholder:'请输入音色模型名称'})+field(node,'transpose','转调',{default:'0'})+field(node,'pitchMethod','音高提取方法',{type:'select',values:['rmvpe','crepe','harvest']})+range(node,'indexRate','特征检索比例',0)+field(node,'filterRadius','中值滤波半径',{default:7})+field(node,'format','输出格式',{type:'select',values:['WAV','MP3','FLAC']});
    if(node.type==='stemSplit')fields=audioInput(node,'audio-in','参考音频',true)+field(node,'stemModel','模型',{type:'select',values:['人声和伴奏','人声、鼓、贝斯及其他']});
    if(node.type==='audioMerge')fields=audioInput(node,'audio-1-in','音轨 1',true)+audioInput(node,'audio-2-in','音轨 2',true)+field(node,'format','输出格式',{type:'select',values:['WAV','MP3','FLAC']});
    if(node.type==='loudness')fields=audioInput(node,'audio-in','参考音频',true)+field(node,'loudness','目标综合响度',{default:'-10'})+field(node,'peak','真峰值上限',{default:'-1'})+field(node,'range','短时响度上限差值',{default:'-8'})+field(node,'allowance','允许偏差',{default:'2'});
    if(node.type==='coverImage')fields=field(node,'coverText','封面文字',{required:true,type:'textarea',placeholder:'填写封面上展示的文字',port:'text-in'})+field(node,'imagePrompt','画面描述',{type:'textarea',placeholder:'描述画面风格与内容'})+field(node,'size','图片尺寸',{type:'select',values:['1440','1024','768'],default:'1440'});
    return `<section class="node-input-section"><h3>输入</h3><div class="node-form">${fields}</div></section>${outputBlock(node)}`;
  }
  function nodeHeight(type){return ({textInput:390,audioUpload:360,writeLyrics:430,aiLyrics:570,refLyrics:960,uploadSong:360,aiSong:1140,refSong:1280,sampleSong:1200,playlistSong:1660,rvc:850,svc:850,stemSplit:430,audioMerge:560,loudness:700,coverImage:600,workOutput:220})[type]||360;}
  function nodeStatus(node){return node.status==='running'?['running','运行中']:node.status==='success'?['success','已完成']:node.status==='error'?['error','待完善']:missingDependencies(node).length?['pending','待配置']:['ready','可运行'];}
  function nodeHTML(node){
    const def=defs[node.type],status=nodeStatus(node),summaryHeight=Math.max(70,(Math.max(portsFor(node.type).inputs.length,portsFor(node.type).outputs.length)-1)*26+20);
    return `<article class="flow-node ${node.type.endsWith('Menu')?'menu-node':''} ${selectedId===node.id?'selected':''} ${node.status||''} ${node.collapsed?'is-collapsed':''}" data-id="${html(node.id)}" style="left:${node.x}px;top:${node.y}px;--node-color:${def.color};--summary-height:${summaryHeight}px">${portMarkup(node,'inputs')}<header class="node-head"><span class="node-symbol">${icon(node.type)}</span><b class="node-title" title="${html(node.title||def.title)}">${html(node.title||def.title)}</b><span class="node-status-badge ${status[0]}">${status[1]}</span><button type="button" class="node-collapse" data-collapse-node aria-label="${node.collapsed?'展开':'收起'}节点" aria-expanded="${!node.collapsed}">${icon('chevron')}</button><button type="button" class="node-remove" aria-label="删除节点" title="删除节点">×</button></header><div class="node-execution-row"><span>←◇</span><b>${icon('execution')}执行顺序</b><span>◇→</span></div><div class="node-summary"><p>${html(def.subtitle)}</p>${canvasNodeSummary(node)}</div><div class="node-body">${nodeForm(node)}</div>${portMarkup(node,'outputs')}</article>`;
  }
  function refreshPortPositions(){
    nodeLayer.querySelectorAll('.flow-node').forEach(element=>{
      const node=nodeById(element.dataset.id);if(!node)return;
      const rect=element.getBoundingClientRect();
      ['inputs','outputs'].forEach(side=>portsFor(node.type)[side].forEach((port,index)=>{
        const direction=side==='inputs'?'input':'output',button=element.querySelector(`.node-port.${direction}[data-port-key="${port.key}"]`),label=element.querySelector(`[data-port-label="${port.key}"]`);
        if(!button)return;let top=port.edgeType==='control'?74:110+(index-1)*26;
        const anchor=element.querySelector(`[data-${side==='inputs'?'input':'output'}-port="${port.key}"]`);
        if(!node.collapsed&&port.edgeType==='data'&&anchor)top=(anchor.getBoundingClientRect().top-rect.top)/state.scale+(side==='inputs'?8:Math.min(anchor.offsetHeight/2,48));
        button.style.top=`${top}px`;if(label)label.style.top=`${top-6}px`;
      }));
    });drawEdges();
  }

  function portPoint(node, portKey, side) {
    const ports = portsFor(node.type)[side];
    const index = Math.max(0, ports.findIndex(port => port.key === portKey));
    const point=nodeLayer.querySelector(`[data-id="${node.id}"] .node-port[data-port-key="${ports[index]?.key}"]`),top=point?parseFloat(point.style.top):NaN; return { x: side === 'outputs' ? node.x + NODE_W : node.x, y: node.y + (Number.isFinite(top)?top:portTop(ports[index] || { edgeType: 'control' }, index)) };
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
    nodeLayer.querySelectorAll('audio').forEach(audio=>audio.pause());portResizeObserver?.disconnect();
    nodeLayer.innerHTML = state.nodes.map(nodeHTML).join('');
    nodeLayer.querySelectorAll('.flow-node').forEach(element=>portResizeObserver?.observe(element));
    document.querySelector('#canvasEmptyHint').classList.toggle('show', !state.nodes.length);
    bindDrag(); drawEdges(); applyViewMode(); requestAnimationFrame(refreshPortPositions);
  }
  function applyViewMode() {
    document.querySelector('#canvasPage').classList.toggle('is-readonly', readOnly);
    document.querySelector('#canvasTitle').readOnly = readOnly;
    document.querySelector('#copyShowcaseWorkflow').hidden = !readOnly;
    document.querySelector('#canvasReadonlyNotice').hidden = !readOnly;
    if (appliedReadOnly !== readOnly) {
      document.querySelectorAll('#historyToggle,#runAll,#publishCanvas,.canvas-action-dock button,#nodePalette button,#workflowNodeSearch').forEach(control => control.disabled = readOnly);
      appliedReadOnly = readOnly;
    }
    nodeLayer.querySelectorAll('button,select,input[type="file"],input[type="range"]').forEach(control => control.disabled = readOnly);
    nodeLayer.querySelectorAll('textarea,input:not([type="file"])').forEach(control => control.readOnly = readOnly);
  }
  function transform() {
    const scale = Math.round(state.scale * 100) / 100;
    state.scale = scale;
    viewport.style.transform = `translate(${Math.round(state.pan.x * 2) / 2}px,${Math.round(state.pan.y * 2) / 2}px)`;
    zoomLayer.style.zoom = String(scale);
    document.querySelector('#zoomValue').textContent = `${Math.round(scale * 100)}%`; document.querySelector('#canvasZoomRange').value=String(Math.round(scale*100));
  }
  function renderAll() { document.querySelector('#canvasTitle').value = state.name; transform(); renderNodes(); renderVersions(); }
  function bindDrag() {
    nodeLayer.querySelectorAll('.flow-node').forEach(element => {
      const node = nodeById(element.dataset.id);
      element.querySelector('.node-head').addEventListener('pointerdown', event => { if (readOnly || navigationMode==='pan' || spacePanning || event.target.closest('button')) return; event.stopPropagation(); selectNode(node.id); pushUndo(); dragging = { id: node.id, x: node.x, y: node.y, clientX: event.clientX, clientY: event.clientY }; });
    });
  }
  function selectNode(id) { selectedId = id; nodeLayer.querySelectorAll('.flow-node').forEach(node => node.classList.toggle('selected', node.dataset.id === id)); }
  function clearSelection() { selectedId = null; nodeLayer.querySelectorAll('.flow-node').forEach(node => node.classList.remove('selected')); }
  function persistDraft() { if (readOnly) return; state.updatedAt = Date.now(); localStorage.setItem(activeDraftKey, JSON.stringify({ ...state, nodes: state.nodes.map(node => ({ ...node, status: 'idle' })) })); const item = typeof workflowData !== 'undefined' ? workflowData.find(workflow => workflow.id === activeWorkflowId && workflow.showcaseSourceId) : null; if (item) { item.name = state.name; item.updatedAt = state.updatedAt; if (typeof persistShowcaseWorkflowCopies === 'function') persistShowcaseWorkflowCopies(); } }
  function queueDraft() {
    if (readOnly) return;
    const box = document.querySelector('.draft-state'), label = document.querySelector('#draftStatus');
    box.classList.add('saving'); label.textContent = '待保存'; clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try{persistDraft();label.textContent='已保存';}catch{label.textContent='保存失败';showToast('草稿保存失败，请检查浏览器存储空间','error');}finally{box.classList.remove('saving');} }, 220);
  }
  function addNode(type, x, y) { if (readOnly) return;
    pushUndo(); const rect = stage.getBoundingClientRect(); const def = defs[type];
    const index = state.nodes.length;
    const viewLeft = Math.max(40, (74 - state.pan.x) / state.scale);
    const viewTop = Math.max(80, (90 - state.pan.y) / state.scale);
    const autoX = viewLeft + (index % 3) * (NODE_W + 92);
    let autoY=viewTop;for(let row=0;row<Math.floor(index/3);row++)autoY+=Math.max(...state.nodes.slice(row*3,row*3+3).map(item=>nodeLayer.querySelector(`[data-id="${item.id}"]`)?.offsetHeight||nodeHeight(item.type)))+100;
    const node = { id: makeId('node'), type, title: def.title+(state.nodes.filter(item=>item.type===type).length+1), x: Math.max(10, x ?? autoX), y: Math.max(10, y ?? autoY), data: {}, status: 'idle', result: '', strength: 72 };
    state.nodes.push(node); renderNodes(); selectNode(node.id); toggleLibrary(false); if(x==null&&y==null){state.pan={x:Math.max(36,(rect.width-NODE_W*state.scale)/2)-node.x*state.scale,y:100-node.y*state.scale};transform();} queueDraft(); showToast(`已添加「${def.title}」节点`);
  }
  function changeType(id, type) { if (readOnly) return;
    const node = nodeById(id); if (!node) return; pushUndo(); state.edges = state.edges.filter(edge => edge.from !== id && edge.to !== id); node.type = type; node.title = defs[type].title; node.data = {}; node.result = ''; node.status = 'idle'; renderNodes(); selectNode(id); queueDraft();
  }
  function deleteNode(id = selectedId) { if (readOnly) return; if (!id) { showToast('请先选择需要删除的节点', 'error'); return; } pushUndo(); state.nodes = state.nodes.filter(node => node.id !== id); state.edges = state.edges.filter(edge => edge.from !== id && edge.to !== id); if (selectedId === id) selectedId = null; renderNodes(); queueDraft(); showToast('节点已删除'); }
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
  function connect(nodeId, direction, button) { if (readOnly) return;
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
  function missingDependencies(node){
    const missing=[],data=node.data||{};
    portsFor(node.type).inputs.filter(port=>port.required).forEach(port=>{
      const local=port.key==='lyrics-in'?data.referenceLyrics?.trim():data[port.key+'File'];
      if(!local&&!state.edges.some(edge=>edge.to===node.id&&edge.toPort===port.key))missing.push(port.label);
    });
    if(['aiLyrics','refLyrics'].includes(node.type)&&!data.userPrompt?.trim())missing.push('用户提示词');
    if(node.type==='writeLyrics'&&!data.lyrics?.trim())missing.push('歌词');
    if(['audioUpload','uploadSong'].includes(node.type)&&!data.fileName)missing.push('音频文件');
    if(node.type==='textInput'&&!data.text?.trim())missing.push('文本内容');
    if(['rvc','svc'].includes(node.type)&&!data.voiceModel?.trim())missing.push('音色模型');
    if(node.type==='coverImage'&&!data.coverText?.trim()&&!state.edges.some(edge=>edge.to===node.id&&edge.toPort==='text-in'))missing.push('封面文字');
    return missing;
  }
  function finishRun(node,result){node.result=result;node.status='success';node.previewRun='';node.runHistory||=[];node.runHistory.push({number:node.runHistory.length+1,result,createdAt:Date.now()});renderNodes();queueDraft();}
  async function runNode(id, quiet = false) {
    if (readOnly) return false;
    const runWorkflowId = activeWorkflowId;
    const node = nodeById(id); if (!node || node.type.endsWith('Menu')) { showToast('请先选择具体功能', 'error'); return false; }
    const runTimbreContext = node.data?.timbreId ? canvasTimbreContext() : '';
    if (node.type === 'workOutput') { if (!quiet) showToast('请在待办中完成成品组装'); return true; }
    if (!validateCanvasTimbre(node)) { node.status = 'error'; renderNodes(); return false; }
    const missing = missingDependencies(node);
    if (missing.length) { node.status = 'error'; renderNodes(); showToast(`缺少：${missing.join('、')}`, 'error'); return false; }
    if (node.type === 'writeLyrics') { finishRun(node,node.data.lyrics);return true; }
    if (node.type === 'textInput') { finishRun(node,node.data.text); if (!quiet) showToast('文本已保存'); return true; }
    if (node.type === 'audioUpload') { finishRun(node,node.data.fileName); if (!quiet) showToast('音频已上传'); return true; }
    node.status = 'running'; renderNodes(); await new Promise(resolve => setTimeout(resolve, 700));
    if (readOnly || activeWorkflowId !== runWorkflowId || nodeById(id) !== node) return false;
    if (runTimbreContext && runTimbreContext !== canvasTimbreContext()) { node.status = 'idle'; renderNodes(); showToast('账号或团队已切换，请重新运行', 'error'); return false; }
    if (!validateCanvasTimbre(node)) { node.status = 'error'; renderNodes(); return false; }
    if (['aiLyrics', 'refLyrics'].includes(node.type)) node.result = `【生成歌词】\n${node.data.userPrompt}\n夜色沿着城市缓缓落下，新的故事正在生长……`;
    else if (node.type === 'uploadSong') node.result = node.data.fileName;
    else if(node.type==='coverImage')node.result=node.data?.coverText||'文字封面示例';
    else node.result = `${node.data?.title || defs[node.type].title} · 演示结果`;
    finishRun(node,node.result); if (!quiet) showToast(`「${defs[node.type].title}」运行成功`); return true;
  }
  function executionOrder() {
    const executable = state.nodes.filter(node => !node.type.endsWith('Menu'));
    const indegree = new Map(executable.map(node => [node.id, 0]));
    state.edges.filter(edge => edge.edgeType === 'control').forEach(edge => { if (indegree.has(edge.to)) indegree.set(edge.to, indegree.get(edge.to) + 1); });
    const queue = executable.filter(node => indegree.get(node.id) === 0), result = [];
    while (queue.length) { const node = queue.shift(); result.push(node); state.edges.filter(edge => edge.edgeType === 'control' && edge.from === node.id).forEach(edge => { if (!indegree.has(edge.to)) return; indegree.set(edge.to, indegree.get(edge.to) - 1); if (indegree.get(edge.to) === 0) queue.push(nodeById(edge.to)); }); }
    return result.length === executable.length ? result : executable;
  }
  async function runAll() { if (readOnly) return; const runWorkflowId = activeWorkflowId; const button = document.querySelector('#runAll'); button.disabled = true; let success = true; const nodes = executionOrder(); if (!nodes.length) { button.disabled = false; showToast('画布中暂无可运行节点', 'error'); return; } for (const node of nodes) { if (readOnly || runWorkflowId !== activeWorkflowId) return; const ok = await runNode(node.id, true); if (readOnly || runWorkflowId !== activeWorkflowId) return; if (!ok) { success = false; break; } } button.disabled = false; if (success) showToast(nodes.some(node => node.type === 'workOutput') ? '业务节点运行完成，请在待办中完成成品组装' : '画布运行完成'); }
  function setZoom(next, anchor) { const old = state.scale; next = Math.max(.25, Math.min(1.5, Math.round(next * 20) / 20)); if (anchor) { const rect = stage.getBoundingClientRect(), ax = anchor.x - rect.left, ay = anchor.y - rect.top, cx = (ax - state.pan.x) / old, cy = (ay - state.pan.y) / old; state.pan.x = ax - cx * next; state.pan.y = ay - cy * next; } state.scale = next; transform(); queueDraft(); }
  function canvasCenter() { const rect = stage.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; }
  function fitCanvas() { if (!state.nodes.length) { state.pan = { x: 90, y: 90 }; setZoom(.85); return; } const rect = stage.getBoundingClientRect(), minX = Math.min(...state.nodes.map(node => node.x)), minY = Math.min(...state.nodes.map(node => node.y)), maxX = Math.max(...state.nodes.map(node => node.x + NODE_W)), maxY = Math.max(...state.nodes.map(node => node.y + (nodeLayer.querySelector(`[data-id="${node.id}"]`)?.offsetHeight||nodeHeight(node.type)))); const topInset = 76, bottomInset = 84, sideInset = 70; const rawScale = Math.min(1, (rect.width - sideInset * 2) / (maxX - minX), (rect.height - topInset - bottomInset) / (maxY - minY)); const scale = Math.max(.25, Math.floor(rawScale * 20) / 20); state.scale = scale; state.pan = { x: (rect.width - (maxX - minX) * scale) / 2 - minX * scale, y: topInset + Math.max(0, (rect.height - topInset - bottomInset - (maxY - minY) * scale) / 2) - minY * scale }; transform(); queueDraft(); }
  function renderVersions() { document.querySelector('#canvasPublishedTime').textContent=versions.length?new Date(versions[0].publishedAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+' ｜ 已发布':'尚未发布'; document.querySelector('#versionBadge').textContent = versions.length ? versions[0].version : 'V1.0'; document.querySelector('#versionList').innerHTML = versions.length ? versions.map((version, index) => `<article class="version-item"><b>${version.version}${index === 0 ? ' · 当前版本' : ''}</b><span>${new Date(version.publishedAt).toLocaleString('zh-CN')} · ${version.nodes.length} 个节点</span><small>✓ 已发布，只读快照</small></article>`).join('') : '<div class="version-empty">尚未发布正式版本。<br>当前变化仅存在于自动草稿中。</div>'; }
  function graphWithAssembly() {
    const outputs = state.nodes.filter(node => node.type === 'workOutput');
    if (outputs.length > 1) throw new Error('仅可保留一个「成品组装」节点，请调整后重新发布。');
    const nodes = deep(state.nodes.filter(node => node.type !== 'workOutput'));
    if (nodes.some(node => node.type.endsWith('Menu'))) throw new Error('请先为所有节点选择具体功能，再重新发布。');
    const ids = new Set(nodes.map(node => node.id));
    const edges = deep(state.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)));
    const indegree = new Map(nodes.map(node => [node.id, 0])), outgoing = new Map(nodes.map(node => [node.id, new Set()]));
    edges.forEach(edge => outgoing.get(edge.from).add(edge.to));
    outgoing.forEach(targets => targets.forEach(id => indegree.set(id, indegree.get(id) + 1)));
    const queue = nodes.filter(node => !indegree.get(node.id)).map(node => node.id);
    let visited = 0;
    while (queue.length) { const id = queue.shift(); visited++; outgoing.get(id).forEach(target => { indegree.set(target, indegree.get(target) - 1); if (!indegree.get(target)) queue.push(target); }); }
    if (visited !== nodes.length) throw new Error('节点连接存在循环，无法确定流程末尾，请调整连线后重新发布。');
    const terminals = nodes.filter(node => !outgoing.get(node.id).size);
    const existing = outputs[0];
    const assembly = existing ? deep(existing) : { id: makeId('assembly'), type: 'workOutput', data: {}, status: 'idle', result: '' };
    assembly.title = '成品组装';
    assembly.x = nodes.length ? Math.max(...nodes.map(node => Number(node.x) || 0)) + NODE_W + 120 : (Number.isFinite(existing?.x) ? existing.x : 100);
    assembly.y = terminals.length ? terminals.reduce((sum, node) => sum + (Number(node.y) || 0), 0) / terminals.length : (Number.isFinite(existing?.y) ? existing.y : 100);
    terminals.forEach(node => {
      const prior = state.edges.find(edge => edge.from === node.id && edge.to === assembly.id && edge.edgeType === 'control');
      edges.push({ id: prior?.id || makeId('edge'), edgeType: 'control', from: node.id, fromPort: 'control-out', to: assembly.id, toPort: 'control-in' });
    });
    return { nodes: [...nodes, assembly], edges };
  }
  function publicationContext() { return JSON.stringify([activeWorkflowId, activeVersionsKey, localStorage.getItem('orchestra-demo-account'), document.querySelector('.workspace-option.active')?.dataset.workspaceId]); }
  function publish() { if (readOnly) return;
    if (publishDialog.open) return;
    publishContext = publicationContext();
    publishError.hidden = true; publishError.textContent = ''; confirmPublishButton.disabled = false;
    publishDialog.showModal();
  }
  function confirmPublish(event) {
    event.preventDefault();
    if (readOnly || !publishDialog.open || confirmPublishButton.disabled) return;
    confirmPublishButton.disabled = true; publishError.hidden = true;
    try {
      if (publishContext !== publicationContext()) throw new Error('当前工作流、账号或团队已变更，请取消后重新发布。');
      const graph = graphWithAssembly(), latest = versions[0]?.version?.match(/^V(\d+)\.(\d+)$/);
      const version = latest ? `V${latest[1]}.${Number(latest[2]) + 1}` : 'V1.0', publishedAt = Date.now();
      const nextVersions = [{ version, publishedAt, name: state.name, nodes: deep(graph.nodes.map(node => ({ ...node, status: 'idle' }))), edges: deep(graph.edges) }, ...versions];
      try { localStorage.setItem(activeVersionsKey, JSON.stringify(nextVersions)); }
      catch { throw new Error('发布保存失败，请检查浏览器存储空间后重试。'); }
      pushUndo(); state.nodes = graph.nodes; state.edges = graph.edges; versions = nextVersions;
      renderNodes(); renderVersions(); queueDraft();
      if (typeof workflowData !== 'undefined') {
        const item = workflowData.find(workflow => workflow.id === activeWorkflowId);
        if (item) Object.assign(item, { name: state.name, version, publish: '已发布', publishClass: 'published', publishTime: new Date(publishedAt).toLocaleString('zh-CN'), updatedAt: publishedAt, updated: '刚刚' });
        if (typeof renderWorkflows === 'function') renderWorkflows();
      }
      publishDialog.close(); showToast(`画布已发布为 ${version}`);
    } catch (error) { publishError.textContent = error.message || '发布失败，请重试。'; publishError.hidden = false; }
    finally { confirmPublishButton.disabled = false; }
  }
  function toggleLibrary(force) { const open = !readOnly && (force ?? !palette.classList.contains('open')); palette.classList.toggle('open', open); palette.setAttribute('aria-hidden', String(!open)); const trigger = document.querySelector('#openNodeLibrary'); trigger.classList.toggle('active', open); trigger.setAttribute('aria-expanded', String(open)); palette.inert=!open;if(!open){document.querySelector('#paletteNodeCount').textContent='16 个节点';document.querySelector('#paletteSearchEmpty').hidden=true;} if (!open) { const search = document.querySelector('#workflowNodeSearch'); search.value = ''; document.querySelectorAll('.workflow-node-option').forEach(button => button.style.display = 'flex'); document.querySelectorAll('.workflow-category').forEach(group => group.style.display = 'block'); } }
  function applySnapshot(data) { if (readOnly) return; state = { ...state, ...deep(data) }; selectedId = null; renderAll(); queueDraft(); }
  function loadWorkflow({ id = 'primary', name = '未命名音乐工作流', version = 'V1.0', published = false, readOnly: preview = false } = {}) {
    if (publishDialog.open) publishDialog.close();
    clearTimeout(saveTimer); persistDraft();
    readOnly = preview; appliedReadOnly = null;
    activeWorkflowId = id;
    activeDraftKey = storageKey(BASE_DRAFT_KEY, activeWorkflowId);
    activeVersionsKey = storageKey(BASE_VERSIONS_KEY, activeWorkflowId);
    versions = parse(localStorage.getItem(activeVersionsKey), []);
    const publishedSource = versions.find(item => item.version === version && item.nodes?.length) || (builtInPublishedSnapshots[id] || []).find(item => item.version === version);
    const initial = { ...defaultState(), name, ...(publishedSource ? { nodes: deep(publishedSource.nodes), edges: deep(publishedSource.edges || []) } : {}) };
    state = readOnly ? initial : parse(localStorage.getItem(activeDraftKey), null) || initial;
    if (state.schemaVersion !== 9) state = initial;
    state.nodes.forEach(node => {node.status = 'idle';node.data ||= {};if(readOnly){node.result='';node.runHistory=[];node.previewRun='';}});
    if (!versions.length && published) { versions = [publishedSource ? deep(publishedSource) : { version, publishedAt: Date.now(), name: state.name, nodes: deep(state.nodes), edges: deep(state.edges) }]; if (!readOnly) localStorage.setItem(activeVersionsKey, JSON.stringify(versions)); }
    selectedId = null; pending = null; portDragging = null; dragging = null; panning = null; undo = []; redo = [];
    document.querySelector('#versionPanel').classList.remove('open');
    toggleLibrary(false);
    renderAll(); queueDraft();
  }
  function copyWorkflow(sourceId, targetId, name) {
    if (sourceId === targetId) throw new Error('副本须使用新的工作流编号');
    const source = sourceId === activeWorkflowId ? snapshot() : parse(localStorage.getItem(storageKey(BASE_DRAFT_KEY, sourceId)), null) || parse(localStorage.getItem(storageKey(BASE_VERSIONS_KEY, sourceId)), [])[0] || (builtInPublishedSnapshots[sourceId] || [])[0] || (typeof workflowData !== 'undefined' && workflowData.some(item => item.id === sourceId) ? defaultState() : null);
    if (!source) throw new Error('未找到可复制的工作流');
    const copied = { ...defaultState(), ...deep(source) }, assemblyIds = new Set(copied.nodes.filter(node => node.type === 'workOutput').map(node => node.id));
    copied.nodes = copied.nodes.filter(node => !assemblyIds.has(node.id)).map(node => ({ ...node, status: 'idle' }));
    copied.edges = (copied.edges || []).filter(edge => !assemblyIds.has(edge.from) && !assemblyIds.has(edge.to));
    localStorage.setItem(storageKey(BASE_DRAFT_KEY, targetId), JSON.stringify({ ...copied, schemaVersion: 9, name, updatedAt: Date.now() }));
    localStorage.removeItem(storageKey(BASE_VERSIONS_KEY, targetId));
  }
  function publishedSnapshotNodes(snapshot) {
    const executable=(snapshot.nodes||[]).filter(node=>!String(node.type||'').endsWith('Menu'));
    const nodeMap=new Map(executable.map(node=>[node.id,node])),indegree=new Map(executable.map(node=>[node.id,0])),outgoing=new Map(executable.map(node=>[node.id,[]]));
    (snapshot.edges||[]).filter(edge=>edge.edgeType==='control'&&nodeMap.has(edge.from)&&nodeMap.has(edge.to)).forEach(edge=>{indegree.set(edge.to,indegree.get(edge.to)+1);outgoing.get(edge.from).push(edge.to)});
    const positionSort=(a,b)=>(Number(a.y)||0)-(Number(b.y)||0)||(Number(a.x)||0)-(Number(b.x)||0),queue=executable.filter(node=>indegree.get(node.id)===0).sort(positionSort),ordered=[];
    while(queue.length){const node=queue.shift();ordered.push(node);outgoing.get(node.id).forEach(id=>{indegree.set(id,indegree.get(id)-1);if(indegree.get(id)===0){queue.push(nodeMap.get(id));queue.sort(positionSort)}})}
    executable.filter(node=>!ordered.includes(node)).sort(positionSort).forEach(node=>ordered.push(node));
    return ordered.map(node=>({id:node.id,type:node.type,title:node.title||defs[node.type]?.title||'未命名节点',subtitle:defs[node.type]?.subtitle||'工作流节点',category:defs[node.type]?.category||'song',...(canvasTimbreTypes.has(node.type)?{data:{timbreId:node.data?.timbreId||'',timbreName:node.data?.timbreName||''}}:{})}));
  }
  function getPublishedSnapshot(workflowId,version){const stored=parse(localStorage.getItem(storageKey(BASE_VERSIONS_KEY,workflowId)),[]),storedExact=stored.find(item=>item.version===version),builtInExact=(builtInPublishedSnapshots[workflowId]||[]).find(item=>item.version===version),snapshot=storedExact?.nodes?.length?storedExact:(builtInExact||storedExact);if(!snapshot)return null;return {workflowId,version:snapshot.version,name:snapshot.name||'',publishedAt:snapshot.publishedAt||0,nodes:publishedSnapshotNodes(snapshot)}}
  window.orchestraWorkflowCanvas = { open: loadWorkflow, copy: copyWorkflow, getPublishedSnapshot };

  nodeLayer.addEventListener('click', event => { if (readOnly) return;
    const element = event.target.closest('.flow-node'); if (!element) return; const id = element.dataset.id;
    const node=nodeById(id);
    if(event.target.closest('[data-pick-node-timbre]')){pickCanvasTimbre(node);return;}
    if(event.target.closest('[data-collapse-node]')){pushUndo();node.collapsed=!node.collapsed;renderNodes();queueDraft();return;}
    if(event.target.closest('[data-toggle-fields]')){node.advancedCollapsed=!node.advancedCollapsed;renderNodes();queueDraft();return;}
    const choiceValue=event.target.closest('[data-choice-field]');if(choiceValue){node.data||={};node.data[choiceValue.dataset.choiceField]=choiceValue.dataset.choiceValue;renderNodes();queueDraft();return;}
    if (event.target.closest('.node-remove')) return deleteNode(id);
    const choice = event.target.closest('[data-switch-type]'); if (choice) return changeType(id, choice.dataset.switchType);
    const back = event.target.closest('[data-back-category]'); if (back) return changeType(id, back.dataset.backCategory === 'lyrics' ? 'lyricsMenu' : 'songMenu');
    const port = event.target.closest('.node-port'); if (port) return connect(id, port.dataset.port, port);
    if (event.target.closest('.workflow-run')) return runNode(id);
    selectNode(id);
  });
  nodeLayer.addEventListener('pointerdown', event => { if (readOnly) return;
    const port = event.target.closest('.node-port.output');
    const element = event.target.closest('.flow-node');
    if (!port || !element) return;
    event.preventDefault();
    event.stopPropagation();
    portDragging = { startX: event.clientX, startY: event.clientY, moved: false };
    connect(element.dataset.id, 'output', port);
  });
  nodeLayer.addEventListener('input', event => { if (readOnly) return; const element = event.target.closest('.flow-node'), fieldName = event.target.dataset.field; if (!element || !fieldName) return; const node = nodeById(element.dataset.id); node.data ||= {}; node.data[fieldName] = event.target.value; if(event.target.type==='range'){const output=event.target.parentElement.querySelector('output');if(output)output.textContent=event.target.value+'%';} const badge=element.querySelector('.node-status-badge');if(badge&&node.status!=='running'){const status=nodeStatus(node);badge.className='node-status-badge '+status[0];badge.textContent=status[1];} queueDraft(); });
  nodeLayer.addEventListener('change', event => { if (readOnly) return; const element = event.target.closest('.flow-node'); if (!element) return; const node = nodeById(element.dataset.id); if(event.target.matches('[data-run-version]')){node.previewRun=event.target.value;renderNodes();return;}
    if(event.target.dataset.uploadPort){const file=event.target.files?.[0];if(file&&!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name)){showToast('请选择音频文件','error');return;}node.data||={};node.data[event.target.dataset.uploadPort+'File']=file?.name||'';renderNodes();queueDraft();return;}
    if (event.target.matches('.song-upload,.audio-upload')) { node.data ||= {}; node.data.fileName = event.target.files?.[0]?.name || ''; node.status = node.data.fileName ? 'success' : 'idle'; renderNodes(); queueDraft(); return; } if (event.target.dataset.field) { node.data ||= {}; node.data[event.target.dataset.field] = event.target.value; queueDraft(); } });
  document.addEventListener('pointermove', event => { if (portDragging && Math.hypot(event.clientX - portDragging.startX, event.clientY - portDragging.startY) > 4) portDragging.moved = true; if (dragging) { const node = nodeById(dragging.id); if (node) { node.x = Math.max(0, dragging.x + (event.clientX - dragging.clientX) / state.scale); node.y = Math.max(0, dragging.y + (event.clientY - dragging.clientY) / state.scale); const element = nodeLayer.querySelector(`[data-id="${node.id}"]`); if (element) { element.style.left = `${node.x}px`; element.style.top = `${node.y}px`; } drawEdges(); } } if (panning) { state.pan.x = panning.x + event.clientX - panning.clientX; state.pan.y = panning.y + event.clientY - panning.clientY; transform(); } });
  document.addEventListener('pointerup', event => { if (portDragging?.moved) { const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.node-port.input'); const targetNode = target?.closest('.flow-node'); if (target && targetNode) connect(targetNode.dataset.id, 'input', target); else { clearPendingConnection(); showToast('请将连线拖到有效的输入端口', 'error'); } } portDragging = null; if (dragging || panning) queueDraft(); dragging = null; panning = null; stage.classList.remove('panning'); });
  stage.addEventListener('pointerdown', event => { if(event.button!==undefined&&event.button!==0)return; if (event.target.closest('.canvas-action-dock,button,input,textarea,select,audio')) return; if(event.target.closest('.flow-node')&&navigationMode!=='pan'&&!spacePanning)return; toggleLibrary(false); clearSelection(); panning = { clientX: event.clientX, clientY: event.clientY, x: state.pan.x, y: state.pan.y }; stage.classList.add('panning'); });
  stage.addEventListener('wheel', event => { event.preventDefault(); setZoom(state.scale * (event.deltaY > 0 ? .92 : 1.08), { x: event.clientX, y: event.clientY }); }, { passive: false });
  stage.addEventListener('dragover', event => event.preventDefault());
  stage.addEventListener('drop', event => { event.preventDefault(); if (readOnly) return; const type = event.dataTransfer.getData('text/node-type'); if (!defs[type]) return; const rect = stage.getBoundingClientRect(); addNode(type, (event.clientX - rect.left - state.pan.x) / state.scale, (event.clientY - rect.top - state.pan.y) / state.scale); });
  stage.addEventListener('keydown', event => { if(event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return; if(event.code==='Space'&&!event.target?.closest?.('button,summary,audio')){event.preventDefault();spacePanning=true;} if (readOnly) return; if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); deleteNode(); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); document.querySelector(event.shiftKey ? '#redoCanvas' : '#undoCanvas').click(); } });
  renderPalette();
  document.querySelectorAll('.palette-node').forEach(button => { button.onclick = () => addNode(button.dataset.nodeType); button.ondragstart = event => { if (readOnly) { event.preventDefault(); return; } event.dataTransfer.setData('text/node-type', button.dataset.nodeType); event.dataTransfer.effectAllowed = 'copy'; }; });
  document.querySelector('#workflowNodeSearch').oninput = event => { const keyword = event.target.value.trim().toLowerCase(); document.querySelector('#paletteSearchEmpty').hidden=true; document.querySelectorAll('.workflow-node-option').forEach(button => { button.style.display = button.textContent.toLowerCase().includes(keyword) ? 'flex' : 'none'; }); document.querySelectorAll('.workflow-category').forEach(group => { group.style.display = [...group.querySelectorAll('.workflow-node-option')].some(button => button.style.display !== 'none') ? 'block' : 'none'; }); const count=[...document.querySelectorAll('.workflow-node-option')].filter(button=>button.style.display!=='none').length;document.querySelector('#paletteNodeCount').textContent=count+' 个节点';document.querySelector('#paletteSearchEmpty').hidden=count>0; };
  document.querySelector('#openNodeLibrary').onclick = () => toggleLibrary(); document.querySelector('#paletteCollapse').onclick = () => toggleLibrary(false);
  document.querySelector('#runAll').onclick = runAll;
  document.querySelector('#zoomIn').onclick = () => setZoom(state.scale + .1, canvasCenter()); document.querySelector('#zoomOut').onclick = () => setZoom(state.scale - .1, canvasCenter()); document.querySelector('#zoomReset').onclick = () => setZoom(1, canvasCenter()); document.querySelector('#fitCanvas').onclick = fitCanvas;
  document.querySelector('#undoCanvas').onclick = () => { if (readOnly) return; if (undo.length) { redo.push(snapshot()); applySnapshot(undo.pop()); } else showToast('暂无可撤销的操作', 'error'); }; document.querySelector('#redoCanvas').onclick = () => { if (readOnly) return; if (redo.length) { undo.push(snapshot()); applySnapshot(redo.pop()); } else showToast('暂无可恢复的操作', 'error'); };
  document.querySelector('#canvasTitle').oninput = event => { if (readOnly) return; state.name = event.target.value; queueDraft(); };
  document.querySelector('#canvasPublishForm').addEventListener('submit', confirmPublish);
  document.querySelector('#cancelCanvasPublish').addEventListener('click', () => publishDialog.close());
  publishDialog.addEventListener('close', () => { publishContext = null; document.querySelector('#publishCanvas').focus(); });
  document.querySelector('#publishCanvas').onclick = publish; document.querySelector('#historyToggle').onclick = () => { if (!readOnly) document.querySelector('#versionPanel').classList.add('open'); }; document.querySelector('#closeHistory').onclick = () => document.querySelector('#versionPanel').classList.remove('open'); document.querySelector('#backProjects').onclick = () => switchPage(typeof getCanvasReturnPage === 'function' ? getCanvasReturnPage() : 'projects');
  const canvasMenu=document.querySelector('#canvasMenu'),menuToggle=document.querySelector('#canvasMenuToggle');
  function closeCanvasMenu(){canvasMenu.hidden=true;menuToggle.setAttribute('aria-expanded','false');}
  menuToggle.onclick=()=>{canvasMenu.hidden=!canvasMenu.hidden;menuToggle.setAttribute('aria-expanded',String(!canvasMenu.hidden));};
  document.querySelectorAll('[data-canvas-page]').forEach(button=>button.onclick=()=>{closeCanvasMenu();persistDraft();switchPage(button.dataset.canvasPage);});
  document.querySelector('#canvasMaterials').onclick=()=>{persistDraft();switchPage('assets');};
  document.querySelector('#canvasFinished').onclick=()=>{persistDraft();switchPage('finished');};
  function setNavigationMode(mode){if(readOnly)return;navigationMode=mode;for(const [id,value] of [['#canvasSelectTool','select'],['#canvasPanTool','pan']]){const button=document.querySelector(id);button.classList.toggle('active',mode===value);button.setAttribute('aria-pressed',String(mode===value));}stage.classList.toggle('pan-mode',mode==='pan');}
  document.querySelector('#canvasSelectTool').onclick=()=>setNavigationMode('select');document.querySelector('#canvasPanTool').onclick=()=>setNavigationMode('pan');
  document.querySelector('#canvasZoomRange').oninput=event=>setZoom(Number(event.target.value)/100,canvasCenter());
  document.querySelector('#canvasCenterView').onclick=fitCanvas;
  const shortcutsDialog=document.querySelector('#canvasShortcutsDialog');document.querySelector('#canvasShortcuts').onclick=()=>shortcutsDialog.showModal();document.querySelector('#closeCanvasShortcuts').onclick=()=>shortcutsDialog.close();
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){toggleLibrary(false);closeCanvasMenu();clearPendingConnection();}});
  document.addEventListener('keyup',event=>{if(event.code==='Space')spacePanning=false;});
  document.addEventListener('pointerdown',event=>{if(!event.target.closest?.('.canvas-brand-menu'))closeCanvasMenu();});
  window.addEventListener('blur',()=>{spacePanning=false;dragging=null;panning=null;stage.classList.remove('panning');});
  const observer = new MutationObserver(() => { const active = document.querySelector('#canvasPage').classList.contains('active'); if(!active){nodeLayer.querySelectorAll('audio').forEach(audio=>audio.pause());closeCanvasMenu();toggleLibrary(false);if(shortcutsDialog.open)shortcutsDialog.close();if(publishDialog.open)publishDialog.close();} if (active && !readOnly && !state.nodes.length) setTimeout(() => toggleLibrary(true), 180); }); observer.observe(document.querySelector('#canvasPage'), { attributes: true, attributeFilter: ['class'] });
  document.querySelector('#copyShowcaseWorkflow').onclick = () => { if (readOnly && typeof copyShowcaseWorkflow === 'function') copyShowcaseWorkflow(activeWorkflowId); };
  renderAll(); queueDraft();
})();
