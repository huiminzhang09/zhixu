/* Two-level folders; local uploads use IndexedDB, metadata stays in the existing catalog. */
(() => {
  const panel = document.querySelector('#assetMaterialsPanel');
  const libraryTabs = Array.from(panel.querySelectorAll('[data-material-library]'));
  let selectedLibrary = 'personal';
  let renderVersion = 0;
  let database;
  let activeMenu = null;
  let materialDrag = null;
  let dragFromMenu = false;
  let dragClickGuardUntil = 0;
  const scriptLoads = new Map();
  const failedExampleSeeds = new Set();
  const locations = new Map(), previewUrls = new Set();
  const q = selector => panel.querySelector(selector);
  const libraryName = library => library === 'personal' ? '个人资产库' : '团队资产库';
  const allowsRootMaterials = context => ['personal', 'team'].includes(context.library);
  const activeTeam = () => document.querySelector('.workspace-option.active')?.dataset.workspaceId || 'orchestra-studio';
  const currentAccount = () => localStorage.getItem('orchestra-demo-account') || 'demo-user';
  const taskTeam = task => projectData.find(project => project.id === task.projectId)?.teamId || 'orchestra-studio';
  const storageKey = team => 'orchestra-material-library-v1:' + team;
  const folderStorageKey = team => 'orchestra-material-folders-v1:' + team;
  const scopeKey = context => context.library === 'personal' ? 'personal:' + context.account : 'team';
  const locationKey = context => JSON.stringify([context.team, context.account, context.library]);
  const contextNow = () => {
    const context = { team: activeTeam(), account: currentAccount(), library: selectedLibrary };
    return { ...context, folderId: locations.get(locationKey(context)) || null };
  };
  const recordId = (task, candidate) => JSON.stringify([task.id, candidate.generationId || candidate.id]);
  const folderIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/></svg>';
  function read(team) {
    const records = JSON.parse(localStorage.getItem(storageKey(team)) || '[]');
    if (!Array.isArray(records)) throw new Error('Invalid material library');
    return records;
  }
  function readFolders(team) {
    const folders = JSON.parse(localStorage.getItem(folderStorageKey(team)) || '[]');
    if (!Array.isArray(folders)) throw new Error('无法读取文件夹');
    return folders;
  }
  function seedTeamExamples(context) {
    if (context.library !== 'team') return;
    const marker = 'orchestra-material-team-examples-v1:' + context.team;
    if (localStorage.getItem(marker) || failedExampleSeeds.has(marker)) return;
    const originalFolders = readFolders(context.team), originalRecords = read(context.team);
    const prefix = 'team-example-v1:' + context.team + ':', createdAt = new Date().toISOString();
    const common = { library: 'team', savedBy: 'team-example', createdAt, example: true };
    const demoFolders = [
      { ...common, id: prefix + 'lyrics', title: '歌词草稿（示例）', parentId: null },
      { ...common, id: prefix + 'project', title: '项目素材（示例）', parentId: null },
      { ...common, id: prefix + 'archive', title: '已归档（示例）', parentId: prefix + 'lyrics' }
    ];
    // A self-contained vector cover keeps image preview and download available offline.
    const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#202c58"/><stop offset=".62" stop-color="#bc7984"/><stop offset="1" stop-color="#f4c59e"/></linearGradient><linearGradient id="river" x2="0" y2="1"><stop stop-color="#f7d2a5"/><stop offset="1" stop-color="#a8c8d4"/></linearGradient></defs>
      <rect width="512" height="512" fill="url(#sky)"/>
      <g fill="#f9e5cb"><circle cx="373" cy="117" r="34"/><circle cx="83" cy="64" r="2"/><circle cx="203" cy="88" r="1.5"/><circle cx="282" cy="44" r="2"/><circle cx="437" cy="60" r="1.5"/></g>
      <path d="M0 299 113 181 195 278 278 208 413 310 512 221V512H0Z" fill="#5b6080"/>
      <path d="m79 218 34-37 40 47-25-10-15 8-12-13Z" fill="#dfcece"/>
      <path d="M0 350 96 287 195 337 305 274 425 348 512 299V512H0Z" fill="#343f5e"/>
      <path d="M0 396 112 353 238 389 341 348 512 399V512H0Z" fill="#202d46"/>
      <path d="M305 354c-21 36-111 50-84 77 19 19 102 31 99 81H181c43-44-38-62-21-88 20-29 129-43 145-70Z" fill="url(#river)"/>
      <text x="40" y="74" fill="#fff1de" font-size="27" letter-spacing="5" font-family="sans-serif">暮色山野</text>
      <text x="42" y="104" fill="#e9d8d7" font-size="10" letter-spacing="4" font-family="sans-serif">EVENING IN THE VALLEY</text>
    </svg>`;
    const demoRecords = [
      { ...common, id: prefix + 'text', title: '夜色里的回声（示例）', type: 'text', content: `《夜色里的回声》

[主歌]
路灯把晚风写成一行
我们沿着星光慢慢走向远方
那些没说出口的愿望
在夜色里轻轻回响

[副歌]
让回声穿过人海与山岗
把每一个平凡的梦照亮

——团队资产库示例文本`, folderIds: { team: null } },
      { ...common, id: prefix + 'image', title: '暮色山野（示例）', type: 'image', url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cover), fileName: '暮色山野.svg', folderIds: { team: null } },
      { ...common, id: prefix + 'audio', title: '生成歌曲（示例）', type: 'audio', url: './assets/reference-song-result-a.wav', fileName: '生成歌曲.wav', folderIds: { team: null } },
      { ...common, id: prefix + 'notes', title: '夏夜手记（示例）', type: 'text', content: `创作方向：轻快、温暖的夏夜氛围。
配器建议：木吉他、轻打击乐和柔和的合成器。
歌词意象：晚风、路灯、远方与重逢。`, folderIds: { team: prefix + 'lyrics' } },
      { ...common, id: prefix + 'brief', title: '封面设计说明（示例）', type: 'text', content: `封面主题：暮色中的山野。
主色：蓝紫色与暖金色。
构图：以山谷和河流引导视线，保留标题空间。`, folderIds: { team: prefix + 'project' } },
      { ...common, id: prefix + 'archived-text', title: '歌词定稿（示例）', type: 'text', content: `风吹过夏夜的街角
你把远方唱成了歌谣
等星光落在我们肩上
再一起走向新的地方`, folderIds: { team: prefix + 'archive' } }
    ];
    const nextFolders = [...originalFolders];
    demoFolders.forEach(folder => {
      if (nextFolders.some(item => item.id === folder.id)) return;
      let title = folder.title, suffix = 2;
      while (nextFolders.some(item => item.library === 'team' && item.parentId === folder.parentId && item.title.toLocaleLowerCase() === title.toLocaleLowerCase())) title = folder.title + ' ' + suffix++;
      nextFolders.push({ ...folder, title });
    });
    let foldersWritten = false, recordsWritten = false;
    try {
      persist(folderStorageKey(context.team), nextFolders); foldersWritten = true;
      persist(storageKey(context.team), [...originalRecords, ...demoRecords.filter(record => !originalRecords.some(item => item.id === record.id))]); recordsWritten = true;
      persist(marker, true);
    } catch {
      // A failed seed must not block access to existing assets or overwrite user edits.
      if (recordsWritten) try { persist(storageKey(context.team), originalRecords); } catch {}
      if (foldersWritten) try { persist(folderStorageKey(context.team), originalFolders); } catch {}
      failedExampleSeeds.add(marker);
      showToast('示例添加失败，已有资产仍可查看，请检查浏览器存储空间', 'error');
    }
  }
  function foldersFor(context) {
    return readFolders(context.team).filter(folder => folder.library === context.library && (context.library === 'team' || folder.savedBy === context.account));
  }
  function visibleRecords(context) {
    return read(context.team).filter(record => {
      if (record.deletedIn?.includes(scopeKey(context))) return false;
      if (record.library && record.library !== context.library) return false;
      return context.library === 'team' || record.savedBy === context.account;
    }).map(record => ({ ...record, title: record.namesByLibrary?.[scopeKey(context)] || record.title }));
  }
  function folderPath(context, folders = foldersFor(context)) {
    const path = [], visited = new Set();
    let id = context.folderId;
    while (id) {
      const folder = folders.find(item => item.id === id);
      if (!folder || visited.has(id) || path.length >= 2) throw new Error('文件夹已不存在，请返回资产库重试');
      path.unshift(folder); visited.add(id); id = folder.parentId;
    }
    return path;
  }
  function recordFolder(record, context, folders) {
    const id = record.folderIds?.[scopeKey(context)];
    return folders.some(folder => folder.id === id) ? id : null;
  }
  function titleValue(value, max = 100) {
    const title = value.trim();
    if (!title) throw new Error('请输入名称');
    if (Array.from(title).length > max) throw new Error(`名称最多 ${max} 个字`);
    if (/[\u0000-\u001f\u007f/\\]/.test(title)) throw new Error('名称不能包含换行、斜杠或反斜杠');
    return title;
  }
  function persist(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { throw new Error('保存失败，浏览器存储空间不足或不可用，请重试'); }
  }
  function createFolder(context, value) {
    const title = titleValue(value, 40), folders = foldersFor(context);
    if (folderPath(context, folders).length >= 2) throw new Error('最多支持 2 层文件夹，不能继续新建子文件夹');
    if (folders.some(folder => folder.parentId === context.folderId && folder.title.toLocaleLowerCase() === title.toLocaleLowerCase())) throw new Error('当前目录已有同名文件夹，请更换名称');
    const folder = { id: crypto.randomUUID(), title, parentId: context.folderId, library: context.library, savedBy: context.account, createdAt: new Date().toISOString() };
    persist(folderStorageKey(context.team), [...readFolders(context.team), folder]);
    return folder;
  }
  function defaultFolder(context) {
    const root = { ...context, folderId: null };
    return foldersFor(root).find(folder => !folder.parentId && folder.title === '未分类素材') || createFolder(root, '未分类素材');
  }
  function organizeLooseMaterials(context) {
    const folders = foldersFor(context);
    const looseIds = new Set(visibleRecords(context).filter(record => {
      // An explicit null placement is an intentional asset-library root item.
      if (allowsRootMaterials(context) && record.folderIds?.[scopeKey(context)] === null) return false;
      return !recordFolder(record, context, folders);
    }).map(record => record.id));
    if (!looseIds.size) return;
    const destination = defaultFolder(context);
    // Keep existing per-library placements and media intact; only classify loose records.
    persist(storageKey(context.team), read(context.team).map(record => looseIds.has(record.id) ? { ...record, folderIds: { ...record.folderIds, [scopeKey(context)]: destination.id } } : record));
  }
  function requireMaterialLocation(context) {
    if (!context.folderId && !allowsRootMaterials(context)) throw new Error('请先进入或新建一个文件夹，再添加素材');
    folderPath(context);
  }
  function addMaterial(context, values) {
    requireMaterialLocation(context);
    const record = { ...values, title: titleValue(values.title), id: values.id || crypto.randomUUID(), library: context.library, savedBy: context.account, folderIds: { [scopeKey(context)]: context.folderId || null }, createdAt: new Date().toISOString() };
    persist(storageKey(context.team), [record, ...read(context.team)]);
    return record;
  }
  function moveMaterial(context, id, targetId) {
    const target = { ...context, folderId: targetId || null };
    requireMaterialLocation(target);
    if (!visibleRecords(context).some(record => record.id === id)) throw new Error('素材已不存在，请刷新后重试');
    const records = read(context.team).map(record => record.id === id ? { ...record, folderIds: { ...record.folderIds, [scopeKey(context)]: target.folderId } } : record);
    persist(storageKey(context.team), records);
  }
  function getItem(context, kind, id) {
    const item = (kind === 'folder' ? foldersFor(context) : visibleRecords(context)).find(entry => entry.id === id);
    if (!item) throw new Error('该项目已不存在，请刷新后重试');
    return item;
  }
  function descendantIds(context, id) {
    const folders = foldersFor(context), ids = new Set([id]);
    for (let changed = true; changed;) {
      changed = false;
      folders.forEach(folder => { if (ids.has(folder.parentId) && !ids.has(folder.id)) { ids.add(folder.id); changed = true; } });
    }
    return ids;
  }
  function moveRestriction(context, kind, id, targetId) {
    const item = getItem(context, kind, id), folders = foldersFor(context), destination = targetId || null;
    const depth = folderPath({ ...context, folderId: destination }, folders).length;
    const current = kind === 'folder' ? item.parentId : recordFolder(item, context, folders);
    if (destination === current) return '当前位置';
    if (kind !== 'folder') return destination || allowsRootMaterials(context) ? '' : '素材需存放在文件夹内';
    const subtree = descendantIds(context, id);
    if (subtree.has(destination)) return '不能移入自身或子文件夹';
    const subtreeHeight = Math.max(...folders.filter(folder => subtree.has(folder.id)).map(folder => folderPath({ ...context, folderId: folder.id }, folders).length)) - folderPath({ ...context, folderId: id }, folders).length + 1;
    if (depth + subtreeHeight > 2) return '移动后将超过 2 层';
    if (folders.some(folder => folder.id !== id && folder.parentId === destination && folder.title.toLocaleLowerCase() === item.title.toLocaleLowerCase())) return '目标位置有同名文件夹';
    return '';
  }
  function moveFolder(context, id, targetId) {
    const reason = moveRestriction(context, 'folder', id, targetId);
    if (reason) throw new Error(reason);
    persist(folderStorageKey(context.team), readFolders(context.team).map(folder => folder.id === id ? { ...folder, parentId: targetId || null } : folder));
  }
  function renameItem(context, kind, id, value) {
    const item = getItem(context, kind, id), title = titleValue(value, kind === 'folder' ? 40 : 100);
    if (kind === 'folder') {
      if (foldersFor(context).some(folder => folder.id !== id && folder.parentId === item.parentId && folder.title.toLocaleLowerCase() === title.toLocaleLowerCase())) throw new Error('同一目录下已有同名文件夹');
      persist(folderStorageKey(context.team), readFolders(context.team).map(folder => folder.id === id ? { ...folder, title } : folder));
    } else {
      persist(storageKey(context.team), read(context.team).map(record => record.id === id ? { ...record, namesByLibrary: { ...record.namesByLibrary, [scopeKey(context)]: title } } : record));
    }
  }
  function deletionContents(context, kind, id) {
    getItem(context, kind, id);
    const folders = foldersFor(context), folderIds = kind === 'folder' ? descendantIds(context, id) : new Set();
    const records = visibleRecords(context).filter(record => kind === 'folder' ? folderIds.has(recordFolder(record, context, folders)) : record.id === id);
    return { folderIds, records };
  }
  function deleteItem(context, kind, id) {
    const { folderIds, records } = deletionContents(context, kind, id), ids = new Set(records.map(record => record.id));
    const oldRecords = read(context.team), oldFolders = readFolders(context.team);
    // Scoped tombstones preserve shared/generated source files and prevent reclassification after deletion.
    const nextRecords = oldRecords.map(record => ids.has(record.id) ? { ...record, deletedIn: [...new Set([...(record.deletedIn || []), scopeKey(context)])] } : record);
    persist(storageKey(context.team), nextRecords);
    try {
      if (kind === 'folder') persist(folderStorageKey(context.team), oldFolders.filter(folder => !folderIds.has(folder.id)));
    } catch (error) { persist(storageKey(context.team), oldRecords); throw error; }
    if (folderIds.has(locations.get(locationKey(context)))) locations.set(locationKey(context), null);
  }
  function openDatabase() {
    if (!database) database = new Promise((resolve, reject) => {
      const request = indexedDB.open('orchestra-material-files', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('无法打开本地文件存储，请检查浏览器设置'));
      request.onblocked = () => reject(new Error('文件存储被占用，请关闭其他演示页面后重试'));
    }).catch(error => { database = null; throw error; });
    return database;
  }
  async function fileOperation(method, id, file) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', method === 'get' ? 'readonly' : 'readwrite');
      const store = transaction.objectStore('files');
      const request = method === 'put' ? store.put(file, id) : store[method](id);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = transaction.onerror = () => reject(new Error('文件保存或读取失败，请检查浏览器存储空间后重试'));
    });
  }
  function uploadType(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(extension) && (!file.type || file.type.startsWith('image/'))) return 'image';
    if (['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'].includes(extension) && (!file.type || file.type.startsWith('audio/') || file.type === 'video/mp4')) return 'audio';
    throw new Error('请选择支持的图片或音频文件');
  }
  async function uploadFile(context, file, title) {
    if (!file || !file.size) throw new Error('请选择一个非空文件');
    if (file.size > 50 * 1024 * 1024) throw new Error('单个文件不能超过 50 MB');
    const type = uploadType(file), name = titleValue(title || file.name);
    requireMaterialLocation(context);
    const blobId = crypto.randomUUID();
    await fileOperation('put', blobId, file);
    try { return addMaterial(context, { type, title: name, blobId, fileName: file.name, size: file.size }); }
    catch (error) { await fileOperation('delete', blobId).catch(() => {}); throw error; }
  }
  function hasSaved(task, candidate) {
    try { return read(taskTeam(task)).some(record => record.id === recordId(task, candidate) && (!record.deletedIn?.includes('team') || (record.savedBy === currentAccount() && !record.deletedIn?.includes('personal:' + currentAccount())))); }
    catch { return false; }
  }
  function save(task, candidate) {
    if (!task?.referenceSongDemo || !task.candidates?.includes(candidate) || !candidate?.url) return false;
    try {
      const team = taskTeam(task), records = read(team), id = recordId(task, candidate);
      if (hasSaved(task, candidate)) { showToast('该歌曲已保存至素材库'); return true; }
      const account = currentAccount();
      const personal = { team, account, library: 'personal', folderId: null }, shared = { ...personal, library: 'team' };
      const personalFolder = defaultFolder(personal), teamFolder = defaultFolder(shared);
      const material = {
        id, title: candidate.title, url: candidate.url, durationSeconds: candidate.durationSeconds,
        taskId: task.id, runId: task.workId, projectId: task.projectId,
        projectName: task.projectName, planName: task.planName, nodeTitle: task.nodeTitle,
        createdAt: new Date().toISOString(), savedBy: account, type: 'audio',
        folderIds: { [scopeKey(personal)]: personalFolder.id, [scopeKey(shared)]: teamFolder.id }
      };
      localStorage.setItem(storageKey(team), JSON.stringify([material, ...records.filter(record => record.id !== id)]));
    } catch { showToast('保存失败，请检查浏览器存储空间后重试', 'error'); return false; }
    render();
    showToast('已保存至「资产 → 素材库 → 未分类素材」');
    return true;
  }
  function stopAudio() { panel.querySelectorAll('audio').forEach(audio => audio.pause()); }
  function releasePreviews() {
    stopAudio();
    previewUrls.forEach(url => URL.revokeObjectURL(url)); previewUrls.clear();
  }
  async function hydratePreviews(version) {
    await Promise.all(Array.from(panel.querySelectorAll('[data-blob-preview]')).map(async element => {
      try {
        const blob = await fileOperation('get', element.dataset.blobPreview);
        if (version !== renderVersion) return;
        if (!blob) throw new Error('文件不存在');
        const url = URL.createObjectURL(blob); previewUrls.add(url); element.src = url;
      } catch {
        if (version !== renderVersion) return;
        const hint = document.createElement('span'); hint.className = 'material-file-missing'; hint.textContent = '本地文件不可用'; element.replaceWith(hint);
      }
    }));
  }
  function previewMarkup(record) {
    const id = escapeHtml(record.id), title = escapeHtml(record.title);
    if (record.type === 'text') return `<button type="button" class="material-text-preview" data-preview-material="${id}" aria-label="查看文字：${title}"><span class="material-text-format" aria-hidden="true">TXT</span><svg class="material-document-symbol" viewBox="0 0 128 128" fill="none" aria-hidden="true"><path d="M51 31h6l4 4v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V32a1 1 0 0 1 1-1Z M57 31v4h4 M53 38h5 M53 41h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M37 83h53 M37 90h41 M37 97h47" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`;
    const source = record.blobId ? `data-blob-preview="${escapeHtml(record.blobId)}"` : `src="${escapeHtml(record.url || '')}"`;
    if (record.type === 'image') return `<button type="button" class="material-image-preview" data-preview-material="${id}" aria-label="查看图片：${title}"><img ${source} alt="${title}" draggable="false"></button>`;
    return `<button type="button" class="material-audio-preview" data-preview-material="${id}" aria-label="试听音频：${title}">${audioSymbol()}</button>`;
  }
  function audioSymbol() {
    return '<svg class="material-waveform-symbol" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M5 19v10 M14.5 5v38 M24 15v18 M33.5 10v28 M43 19v10" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>';
  }
  function materialDate(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '—';
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
  }
  function menuTrigger(kind, item) {
    return `<button type="button" class="material-more-button" data-material-menu="${kind}" data-material-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.title)}的更多操作" aria-haspopup="menu" aria-expanded="false">⋯</button>`;
  }
  function render() {
    clearMaterialDrag();
    closeMenu();
    releasePreviews();
    const version = ++renderVersion;
    try {
      const context = contextNow();
      seedTeamExamples(context);
      organizeLooseMaterials(context);
      const folders = foldersFor(context);
      let path;
      try { path = folderPath(context, folders); }
      catch { context.folderId = null; locations.delete(locationKey(context)); path = []; }
      const children = folders.filter(folder => folder.parentId === context.folderId);
      const allRecords = visibleRecords(context), records = allRecords.filter(record => recordFolder(record, context, folders) === context.folderId);
      q('#materialBreadcrumb').innerHTML = [{ id: '', title: libraryName(context.library) }, ...path].map((folder, index) => `${index ? '<span aria-hidden="true">/</span>' : ''}${index === path.length ? `<span aria-current="page">${escapeHtml(folder.title)}</span>` : `<button type="button" data-open-material-folder="${escapeHtml(folder.id)}">${escapeHtml(folder.title)}</button>`}`).join('');
      q('#materialFolderHint').textContent = !path.length ? (allowsRootMaterials(context) ? '可直接新建文件夹、新建文本或上传资产；文件夹最多支持 2 层。' : '素材按文件夹存放，点击文件夹查看内容；最多支持 2 层文件夹。') : path.length >= 2 ? '已达第 2 层，可添加文字、图片和音频；如需新建文件夹，请返回上级。' : '可添加文字、图片和音频，或新建第二层文件夹。';
      q('#materialFolders').innerHTML = children.map(folder => {
        const title = escapeHtml(folder.title), date = materialDate(folder.createdAt);
        return `<div role="listitem" class="material-folder-item" data-drop-material-folder="${escapeHtml(folder.id)}"><button class="material-folder-card" type="button" data-open-material-folder="${escapeHtml(folder.id)}" aria-label="打开文件夹：${title}"><span class="material-folder-cover"><img src="./assets/material-folder.svg" alt="" draggable="false"></span><span class="material-folder-info"><strong title="${title}">${title}</strong><time datetime="${escapeHtml(folder.createdAt)}">${escapeHtml(date)}</time></span></button><input type="checkbox" class="material-folder-select" aria-label="选择文件夹：${title}">${menuTrigger('folder', folder)}</div>`;
      }).join('');
      q('#materialFolders').hidden = !children.length;
      q('#materialLibraryDescription').textContent = !context.folderId ? `共 ${allRecords.length} 个素材${allowsRootMaterials(context) ? '（含子文件夹）' : '，按文件夹存放'}` : `${libraryName(context.library)} · 当前文件夹`;
      q('#materialCount').textContent = !context.folderId && !allowsRootMaterials(context) ? `共 ${children.length} 个文件夹` : `共 ${children.length} 个文件夹 · ${records.length} 个素材`;
      q('#materialItems').hidden = !records.length && children.length > 0;
      q('#materialItems').innerHTML = records.map(record => {
        const type = ['text', 'image'].includes(record.type) ? record.type : 'audio';
        const date = materialDate(record.createdAt);
        return `<article class="material-file-card" role="listitem" draggable="true" data-drag-material="${escapeHtml(record.id)}"><div class="material-file-preview material-file-preview-${type}">${previewMarkup(record)}</div><div class="material-file-info"><h3 title="${escapeHtml(record.title)}">${escapeHtml(record.title)}</h3>${menuTrigger('material', record)}<time datetime="${escapeHtml(record.createdAt)}">${escapeHtml(date)}</time></div></article>`;
      }).join('') || `<p class="material-grid-message">${context.folderId ? '当前文件夹暂无素材，可新建文字、上传图片或音频。' : allowsRootMaterials(context) ? '暂无内容，点击「＋ 新建」添加文件夹、文本或上传资产。' : '暂无文件夹，点击「新建文件夹」开始整理素材。'}</p>`;
      hydratePreviews(version);
    } catch {
      q('#materialCount').textContent = '素材读取失败';
      q('#materialFolders').innerHTML = '';
      q('#materialItems').hidden = false;
      q('#materialItems').innerHTML = '<p class="material-grid-message" role="status">无法读取或整理素材，原有记录仍保留，请检查浏览器存储空间后重试。</p>';
    }
  }
  function openFolder(id) {
    const context = { ...contextNow(), folderId: id || null };
    try { folderPath(context); locations.set(locationKey(context), context.folderId); render(); }
    catch (error) { showToast(error.message, 'error'); }
  }
  function setMaterialDropTarget(target) {
    if (!materialDrag || materialDrag.target === target) return;
    materialDrag.target?.classList.remove('is-drop-target');
    materialDrag.target = target;
    target?.classList.add('is-drop-target');
  }
  function clearMaterialDrag() {
    if (!materialDrag) return;
    materialDrag.source.classList.remove('is-dragging');
    materialDrag.target?.classList.remove('is-drop-target');
    panel.classList.remove('material-drag-active');
    materialDrag = null;
    dragClickGuardUntil = Date.now() + 300;
  }
  function materialDropDestination(targetId) {
    if (!materialDrag) throw new Error('请重新拖拽素材');
    const context = contextNow();
    if (locationKey(context) !== locationKey(materialDrag.context) || context.folderId !== materialDrag.context.folderId) throw new Error('当前位置已变化，请重新拖拽');
    const folders = foldersFor(context), item = getItem(context, 'material', materialDrag.id);
    if (recordFolder(item, context, folders) !== context.folderId) throw new Error('素材位置已变化，请刷新后重试');
    const folder = folders.find(entry => entry.id === targetId);
    if (!folder || folder.parentId !== context.folderId) throw new Error('请拖入当前目录中的文件夹');
    const reason = moveRestriction(context, 'material', item.id, folder.id);
    if (reason) throw new Error(reason);
    return { context, item, folder };
  }
  function handleMaterialDragOver(event) {
    if (!materialDrag) return;
    const target = event.target.closest('[data-drop-material-folder]');
    try {
      if (!target) throw new Error('无目标文件夹');
      materialDropDestination(target.dataset.dropMaterialFolder);
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      setMaterialDropTarget(target);
    } catch {
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
      setMaterialDropTarget(null);
    }
  }
  function closeMenu(restoreFocus = false) {
    if (!activeMenu) return;
    closeMoveMenus();
    const { menu, trigger } = activeMenu; activeMenu = null;
    menu.remove(); trigger.setAttribute('aria-expanded', 'false'); trigger.removeAttribute('aria-controls');
    if (restoreFocus && trigger.isConnected) trigger.focus();
  }
  function closeMoveMenus(level = 0) {
    if (!activeMenu?.submenus) return;
    activeMenu.submenus.splice(level).reverse().forEach(({ menu, trigger }) => {
      menu.remove(); trigger.setAttribute('aria-expanded', 'false'); trigger.removeAttribute('aria-controls');
    });
  }
  function insideActiveMenu(target) {
    return activeMenu && (activeMenu.menu.contains(target) || activeMenu.trigger.contains(target) || activeMenu.submenus.some(entry => entry.menu.contains(target)));
  }
  function moveMenuEntries(context, kind, id, parentId) {
    const folders = foldersFor(context);
    return folders.filter(folder => folder.parentId === parentId).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN')).map(folder => {
      const reason = moveRestriction(context, kind, id, folder.id);
      const hasChildren = folders.some(child => child.parentId === folder.id);
      const canBrowse = hasChildren && Array.from(descendantIds(context, folder.id)).some(target => !moveRestriction(context, kind, id, target));
      return { ...folder, reason, hasChildren, disabled: Boolean(reason) && !canBrowse };
    });
  }
  function moveNewFolderRestriction(context, kind, id, parentId) {
    const depth = folderPath({ ...context, folderId: parentId }).length;
    if (depth >= 2) return '最多支持 2 层文件夹';
    if (kind === 'folder') {
      const subtree = descendantIds(context, id);
      if (subtree.has(parentId)) return '不能移入自身或子文件夹';
      const height = subtree.size > 1 ? 2 : 1;
      if (depth + 1 + height > 2) return '移动后将超过 2 层';
    }
    return '';
  }
  function performMove(context, kind, id, targetId) {
    const reason = moveRestriction(context, kind, id, targetId);
    if (reason) throw new Error(reason);
    if (kind === 'folder') moveFolder(context, id, targetId); else moveMaterial(context, id, targetId);
  }
  function openMoveNewFolder(context, kind, id, parentId) {
    const reason = moveNewFolderRestriction(context, kind, id, parentId);
    if (reason) throw new Error(reason);
    const target = { ...context, folderId: parentId }, item = getItem(context, kind, id);
    closeMenu(true);
    openDialog('新建文件夹', `<p class="material-dialog-hint">位置：${escapeHtml(destinationLabel(target))}</p><label>文件夹名称 <span>*</span><input name="title" required maxlength="40" placeholder="请输入文件夹名称" autocomplete="off" autofocus></label><p class="material-dialog-hint">创建后将「${escapeHtml(item.title)}」移入新文件夹。</p>`, '创建并移入', form => {
      getItem(context, kind, id);
      const restriction = moveNewFolderRestriction(context, kind, id, parentId);
      if (restriction) throw new Error(restriction);
      const previousFolders = readFolders(context.team), folder = createFolder(target, form.elements.title.value);
      try { performMove(context, kind, id, folder.id); }
      catch (error) { persist(folderStorageKey(context.team), previousFolders); throw error; }
      showToast('已创建文件夹并移入');
    });
  }
  function openMoveMenu(trigger, context, kind, id, parentId = null, level = 0, focus = false) {
    if (!activeMenu) return;
    if (activeMenu.submenus[level]?.trigger === trigger) {
      if (focus) activeMenu.submenus[level].menu.querySelector('button:not(:disabled)')?.focus();
      return;
    }
    const entries = moveMenuEntries(context, kind, id, parentId);
    const parent = parentId ? getItem(context, 'folder', parentId) : null;
    const reason = moveRestriction(context, kind, id, parentId), createReason = moveNewFolderRestriction(context, kind, id, parentId);
    closeMoveMenus(level);
    const ownerMenu = level ? activeMenu.submenus[level - 1].menu : activeMenu.menu;
    const menu = document.createElement('div');
    menu.className = 'material-dropdown material-move-submenu'; menu.id = `materialMoveMenu${level}`;
    menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', `移动到${parent?.title || libraryName(context.library)}`);
    const currentDestination = parentId || !reason
      ? `<button type="button" role="menuitem" tabindex="-1" class="material-move-current" data-move-current ${reason ? `disabled title="${escapeHtml(reason)}"` : ''}><span>${parentId ? '移到此文件夹' : '移到资产库根目录'}</span>${reason ? `<small>${escapeHtml(reason)}</small>` : ''}</button>` : '';
    menu.innerHTML = `<div class="material-move-menu-heading"><span title="${escapeHtml(parent?.title || libraryName(context.library))}">${escapeHtml(parent?.title || libraryName(context.library))}</span><button type="button" role="menuitem" tabindex="-1" data-move-create aria-label="新建文件夹并移入" title="${escapeHtml(createReason || '新建文件夹并移入')}" ${createReason ? 'disabled' : ''}>+</button></div>${currentDestination}${entries.map((entry, index) => `<button type="button" role="menuitem" tabindex="-1" class="material-move-destination" data-move-index="${index}" ${entry.disabled ? 'disabled' : ''} title="${escapeHtml(entry.reason || entry.title)}" ${entry.hasChildren ? 'aria-haspopup="menu" aria-expanded="false"' : ''}><span class="material-move-menu-icon">${folderIcon}</span><span class="material-move-menu-name">${escapeHtml(entry.title)}</span>${entry.hasChildren ? '<span class="material-move-menu-arrow" aria-hidden="true">›</span>' : ''}${entry.reason ? `<small>${escapeHtml(entry.reason)}</small>` : ''}</button>`).join('')}${entries.length ? '' : '<p class="material-move-menu-empty">暂无文件夹</p>'}`;
    document.body.append(menu); activeMenu.submenus.push({ menu, trigger, parentId });
    trigger.setAttribute('aria-expanded', 'true'); trigger.setAttribute('aria-controls', menu.id);
    const rect = trigger.getBoundingClientRect(), owner = ownerMenu.getBoundingClientRect(), bounds = menu.getBoundingClientRect();
    const left = owner.right + bounds.width + 6 <= window.innerWidth - 8 ? owner.right + 6 : owner.left - bounds.width - 6;
    menu.style.left = Math.max(8, Math.min(left, window.innerWidth - bounds.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(rect.top - 5, window.innerHeight - bounds.height - 8)) + 'px';
    menu.style.zIndex = String(101 + level);
    const enabled = Array.from(menu.querySelectorAll('button:not(:disabled)'));
    if (focus) (menu.querySelector('.material-move-destination:not(:disabled)') || enabled[0])?.focus();
    const expand = (button, focusChild) => {
      const entry = entries[Number(button.dataset.moveIndex)];
      if (entry?.hasChildren && !entry.disabled) openMoveMenu(button, context, kind, id, entry.id, level + 1, focusChild);
      else closeMoveMenus(level + 1);
    };
    menu.addEventListener('pointerover', event => {
      const button = event.target.closest('button');
      if (!button) return;
      try {
        if (button.dataset.moveIndex !== undefined && !button.disabled) expand(button, false);
        else closeMoveMenus(level + 1);
      } catch (error) { showToast(error.message, 'error'); }
    });
    menu.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button || button.disabled) return;
      try {
        if (button.hasAttribute('data-move-create')) { openMoveNewFolder(context, kind, id, parentId); return; }
        let destination = parentId;
        if (button.dataset.moveIndex !== undefined) {
          const entry = entries[Number(button.dataset.moveIndex)];
          if (entry.hasChildren) { expand(button, true); return; }
          destination = entry.id;
        }
        performMove(context, kind, id, destination);
        closeMenu(true); render(); showToast('已移动');
      } catch (error) { showToast(error.message || '移动失败，请重试', 'error'); }
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape' || event.key === 'ArrowLeft') {
        event.preventDefault(); event.stopPropagation(); closeMoveMenus(level); trigger.focus(); return;
      }
      if (event.key === 'Tab') { closeMenu(true); return; }
      const button = event.target.closest('button');
      if (event.key === 'ArrowRight' && button?.dataset.moveIndex !== undefined) {
        event.preventDefault();
        try { expand(button, true); } catch (error) { showToast(error.message, 'error'); }
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); closeMoveMenus(level + 1);
      const index = enabled.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
      enabled[next]?.focus();
    });
    menu.addEventListener('scroll', () => closeMoveMenus(level + 1));
  }
  function openMenu(trigger, items) {
    if (activeMenu?.trigger === trigger) { closeMenu(true); return; }
    closeMenu();
    const menu = document.createElement('div'); menu.className = 'material-dropdown' + (trigger.dataset.materialMenu === 'folder' ? ' material-folder-dropdown' : ''); menu.id = 'materialActionMenu'; menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', trigger.getAttribute('aria-label') || '新建');
    menu.innerHTML = items.map((item, index) => `<button type="button" role="menuitem" tabindex="-1" data-menu-index="${index}" ${item.reason ? `disabled title="${escapeHtml(item.reason)}"` : ''} ${item.submenu ? 'aria-haspopup="menu" aria-expanded="false"' : ''} class="${item.danger ? 'material-danger' : ''}"><span>${escapeHtml(item.label)}</span>${item.submenu ? '<span aria-hidden="true">›</span>' : ''}${item.reason ? `<small>${escapeHtml(item.reason)}</small>` : ''}</button>`).join('');
    document.body.append(menu); activeMenu = { menu, trigger, submenus: [] };
    trigger.setAttribute('aria-expanded', 'true'); trigger.setAttribute('aria-controls', menu.id);
    const rect = trigger.getBoundingClientRect(), bounds = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(rect.right - bounds.width, window.innerWidth - bounds.width - 8)) + 'px';
    menu.style.top = Math.max(8, rect.bottom + bounds.height + 6 <= window.innerHeight ? rect.bottom + 6 : rect.top - bounds.height - 6) + 'px';
    const enabled = Array.from(menu.querySelectorAll('button:not(:disabled)'));
    enabled[0]?.focus();
    const expand = (button, focus) => {
      const submenu = items[Number(button.dataset.menuIndex)]?.submenu;
      if (submenu) openMoveMenu(button, submenu.context, submenu.kind, submenu.id, null, 0, focus);
      else closeMoveMenus();
    };
    menu.addEventListener('pointerover', event => {
      const button = event.target.closest('[data-menu-index]'); if (!button || button.disabled) return;
      try { expand(button, false); } catch (error) { showToast(error.message, 'error'); }
    });
    menu.addEventListener('click', async event => {
      const button = event.target.closest('[data-menu-index]'); if (!button || button.disabled) return;
      if (items[Number(button.dataset.menuIndex)]?.submenu) {
        try { expand(button, true); } catch (error) { showToast(error.message, 'error'); }
        return;
      }
      closeMenu(true);
      try { await items[Number(button.dataset.menuIndex)].action(); }
      catch (error) { showToast(error.message || '操作失败，请重试', 'error'); }
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(true); return; }
      if (event.key === 'Tab') { closeMenu(true); return; }
      if (event.key === 'ArrowRight') {
        const button = event.target.closest('[data-menu-index]');
        if (button && !button.disabled) {
          event.preventDefault();
          try { expand(button, true); } catch (error) { showToast(error.message, 'error'); }
        }
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); closeMoveMenus();
      const index = enabled.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
      enabled[next]?.focus();
    });
    menu.addEventListener('scroll', () => closeMoveMenus());
  }
  function createMenuItems(context) {
    const materialReason = context.folderId || allowsRootMaterials(context) ? '' : '请先进入文件夹';
    return [
      { label: '新建文件夹', reason: folderPath(context).length >= 2 ? '已达到 2 层上限' : '', action: openCreateFolder },
      { label: '新建文本', reason: materialReason, action: openTextEditor },
      { label: '上传资产', reason: materialReason, action: openUpload }
    ];
  }
  function openCardMenu(trigger) {
    const context = contextNow(), kind = trigger.dataset.materialMenu, id = trigger.dataset.materialId;
    getItem(context, kind, id);
    openMenu(trigger, [
      { label: '移动到', submenu: { context, kind, id } },
      { label: '下载', action: async () => {
        trigger.disabled = true; trigger.setAttribute('aria-busy', 'true');
        try {
          const item = getItem(context, kind, id);
          if (kind === 'folder') { showToast('正在打包文件夹…'); const blob = await folderArchive(context, id); saveDownload(blob, item.title + '.zip'); showToast('文件夹已打包，正在下载'); }
          else await download(item);
        } finally { trigger.disabled = false; trigger.removeAttribute('aria-busy'); }
      } },
      { label: '重命名', action: () => openRename(context, kind, id) },
      { label: '删除', danger: true, action: () => openDelete(context, kind, id) }
    ]);
  }
  function openDialog(title, body, submitLabel, onSubmit) {
    const trigger = document.activeElement, dialog = document.createElement('dialog');
    let busy = false;
    dialog.className = 'material-dialog'; dialog.setAttribute('aria-labelledby', 'materialDialogTitle');
    dialog.innerHTML = `<form novalidate><header><h2 id="materialDialogTitle">${escapeHtml(title)}</h2><button type="button" data-close aria-label="关闭">×</button></header>${body}<p class="material-dialog-error" role="alert"></p><footer><button type="button" data-close>${submitLabel ? '取消' : '关闭'}</button>${submitLabel ? `<button type="submit" class="material-primary">${escapeHtml(submitLabel)}</button>` : ''}</footer></form>`;
    const form = dialog.querySelector('form'), error = dialog.querySelector('.material-dialog-error');
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => { if (!busy) dialog.close(); }));
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (busy || !onSubmit) return;
      error.textContent = ''; if (!form.reportValidity()) return;
      busy = true; dialog.setAttribute('aria-busy', 'true');
      dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });
      try { await onSubmit(form); dialog.close(); render(); }
      catch (failure) { error.textContent = failure.message || '操作失败，请重试'; }
      finally { busy = false; dialog.removeAttribute('aria-busy'); dialog.querySelectorAll('button').forEach(button => { button.disabled = false; }); }
    });
    dialog.addEventListener('close', () => { dialog.querySelectorAll('audio').forEach(audio => audio.pause()); dialog.remove(); if (trigger?.isConnected) trigger.focus(); }, { once: true });
    document.body.append(dialog); dialog.showModal(); return dialog;
  }
  function destinationLabel(context) {
    return [libraryName(context.library), ...folderPath(context).map(folder => folder.title)].join(' / ');
  }
  function openCreateFolder() {
    const context = contextNow();
    try {
      if (folderPath(context).length >= 2) { showToast('最多支持 2 层文件夹', 'error'); return; }
      openDialog('新建文件夹', `<p class="material-dialog-hint">位置：${escapeHtml(destinationLabel(context))}</p><label>文件夹名称 <span>*</span><input name="title" required maxlength="40" placeholder="请输入文件夹名称" autocomplete="off" autofocus></label><p class="material-dialog-hint">最多 40 个字，同一目录下名称不能重复。</p>`, '创建', form => { createFolder(context, form.elements.title.value); showToast('文件夹已创建'); });
    } catch (error) { showToast(error.message, 'error'); }
  }
  function openTextEditor() {
    const context = contextNow();
    requireMaterialLocation(context);
    openDialog('新建文本', `<p class="material-dialog-hint">保存到：${escapeHtml(destinationLabel(context))}</p><label>名称 <span>*</span><input name="title" required maxlength="100" placeholder="例如：歌曲灵感、参考歌词" autofocus></label><label>文字内容 <span>*</span><textarea name="content" required maxlength="20000" placeholder="请输入文字内容"></textarea></label>`, '保存', form => {
      const content = form.elements.content.value.trim();
      if (!content) throw new Error('请输入文字内容');
      addMaterial(context, { title: form.elements.title.value, type: 'text', content }); showToast('文字已保存');
    });
  }
  function openUpload() {
    const context = contextNow();
    requireMaterialLocation(context);
    const dialog = openDialog('上传资产', `<p class="material-dialog-hint">保存到：${escapeHtml(destinationLabel(context))}</p><label>选择文件 <span>*</span><input type="file" name="file" accept=".png,.jpg,.jpeg,.gif,.webp,.avif,.mp3,.wav,.m4a,.ogg,.flac,.aac" required></label><p class="material-dialog-hint">支持 PNG、JPG、GIF、WebP、AVIF 图片及 MP3、WAV、M4A、OGG、FLAC、AAC 音频，单个文件不超过 50 MB。文件保存在当前浏览器。</p><label>素材名称 <span>*</span><input name="title" required maxlength="100" placeholder="选择文件后自动填入，可修改"></label>`, '上传', async form => {
      await uploadFile(context, form.elements.file.files[0], form.elements.title.value); showToast('素材已上传');
    });
    const form = dialog.querySelector('form');
    form.elements.file.addEventListener('change', () => { if (form.elements.file.files[0]) form.elements.title.value = form.elements.file.files[0].name.slice(0, 100); });
  }
  function openRename(context, kind, id) {
    const item = getItem(context, kind, id);
    const dialog = openDialog('重命名', `<label>${kind === 'folder' ? '文件夹名称' : '素材名称'} <span>*</span><input name="title" required maxlength="${kind === 'folder' ? 40 : 100}" autocomplete="off" autofocus></label>`, '保存', form => {
      renameItem(context, kind, id, form.elements.title.value); showToast('名称已更新');
    });
    const input = dialog.querySelector('input'); input.value = item.title; input.select();
  }
  function openDelete(context, kind, id) {
    const item = getItem(context, kind, id), contents = deletionContents(context, kind, id);
    const detail = kind === 'folder' ? `包含 ${contents.folderIds.size - 1} 个子文件夹和 ${contents.records.length} 个素材。` : '';
    const dialog = openDialog('删除' + (kind === 'folder' ? '文件夹' : '素材'), `<p class="material-delete-message">确认删除「${escapeHtml(item.title)}」？</p><p class="material-dialog-hint">${detail}删除后将从当前资产库移除，其他资产库和生产运行中的原始资源不受影响。</p>`, '删除', () => {
      deleteItem(context, kind, id); showToast('已删除');
    });
    dialog.querySelector('[type="submit"]').classList.add('material-delete-confirm');
  }
  async function openPreview(record) {
    if (record.type === 'text') {
      openDialog(record.title, `<div class="material-text-content">${escapeHtml(record.content)}</div>`); return;
    }
    let url = record.url, temporary = false;
    if (record.blobId) {
      const blob = await fileOperation('get', record.blobId);
      if (!blob) throw new Error('本地文件不存在，请重新上传');
      url = URL.createObjectURL(blob); temporary = true;
    }
    if (!url) throw new Error('文件不可用，请重新上传');
    try {
      const content = record.type === 'image'
        ? `<img class="material-full-image" src="${escapeHtml(url)}" alt="${escapeHtml(record.title)}">`
        : `<div class="material-audio-dialog-cover">${audioSymbol()}</div><audio class="material-audio-player" controls preload="metadata" src="${escapeHtml(url)}" aria-label="试听 ${escapeHtml(record.title)}"></audio>`;
      const dialog = openDialog(record.title, content);
      dialog.addEventListener('play', event => {
        document.querySelectorAll('audio').forEach(audio => { if (audio !== event.target) audio.pause(); });
      }, true);
      if (temporary) dialog.addEventListener('close', () => URL.revokeObjectURL(url), { once: true });
    } catch (error) {
      if (temporary) URL.revokeObjectURL(url);
      throw error;
    }
  }
  async function download(record) {
    let url = record.url, temporary = false;
    if (record.type === 'text' || record.blobId) {
      const blob = record.type === 'text' ? new Blob([record.content], { type: 'text/plain;charset=utf-8' }) : await fileOperation('get', record.blobId);
      if (!blob) throw new Error('本地文件不存在，请重新上传');
      url = URL.createObjectURL(blob); temporary = true;
    }
    const link = document.createElement('a'); link.href = url; link.download = materialFileName(record);
    document.body.append(link); link.click(); link.remove();
    if (temporary) setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function archiveSegment(value) {
    return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '') || '未命名';
  }
  function materialFileName(record) {
    const extension = record.type === 'text' ? 'txt' : record.fileName?.split('.').pop() || 'wav';
    const title = archiveSegment(record.title);
    return title.toLowerCase().endsWith('.' + extension.toLowerCase()) ? title : title + '.' + extension;
  }
  function saveDownload(blob, name) {
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  function loadLocalScript(src) {
    if (!scriptLoads.has(src)) scriptLoads.set(src, new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = src;
      script.onload = resolve;
      script.onerror = () => { script.remove(); scriptLoads.delete(src); reject(new Error('下载组件加载失败，请刷新后重试')); };
      document.body.append(script);
    }));
    return scriptLoads.get(src);
  }
  async function materialBlob(record) {
    if (record.type === 'text') return new Blob([record.content], { type: 'text/plain;charset=utf-8' });
    if (record.blobId) {
      const blob = await fileOperation('get', record.blobId);
      if (!blob) throw new Error(`「${record.title}」的本地文件不存在，未生成下载包`);
      return blob;
    }
    if (['./assets/reference-song-result-a.wav', './assets/reference-song-result-b.wav'].includes(record.url)) {
      if (!window.orchestraMaterialDemoAudio) await loadLocalScript('./assets/material-demo-audio.js');
      const binary = atob(window.orchestraMaterialDemoAudio[record.url]);
      return new Blob([Uint8Array.from(binary, char => char.charCodeAt(0))], { type: 'audio/wav' });
    }
    const response = await fetch(record.url);
    if (!response.ok) throw new Error(`「${record.title}」读取失败，未生成下载包`);
    return response.blob();
  }
  async function folderArchive(context, id) {
    const folder = getItem(context, 'folder', id), folders = foldersFor(context), ids = descendantIds(context, id);
    const records = visibleRecords(context).filter(record => ids.has(recordFolder(record, context, folders)));
    if (!window.JSZip) await loadLocalScript('./vendor/jszip.min.js');
    const zip = new window.JSZip(), paths = new Map(), used = new Set();
    const allocate = (parent, name, isFolder) => {
      const clean = archiveSegment(name), dot = isFolder ? -1 : clean.lastIndexOf('.');
      const base = dot > 0 ? clean.slice(0, dot) : clean, extension = dot > 0 ? clean.slice(dot) : '';
      let result = parent + clean, n = 2;
      while (used.has(result.toLocaleLowerCase())) result = parent + base + ` (${n++})` + extension;
      used.add(result.toLocaleLowerCase()); return result;
    };
    const rootPath = allocate('', folder.title, true); paths.set(id, rootPath); zip.folder(rootPath);
    folders.filter(item => ids.has(item.id) && item.id !== id).sort((a, b) => folderPath({ ...context, folderId: a.id }, folders).length - folderPath({ ...context, folderId: b.id }, folders).length).forEach(item => {
      const path = allocate(paths.get(item.parentId) + '/', item.title, true); paths.set(item.id, path); zip.folder(path);
    });
    for (const record of records) {
      const path = allocate(paths.get(recordFolder(record, context, folders)) + '/', materialFileName(record), false);
      const blob = await materialBlob(record);
      zip.file(path, new Uint8Array(await blob.arrayBuffer()));
    }
    return zip.generateAsync({ type: 'blob', compression: 'STORE' });
  }
  function selectLibrary(tab) {
    selectedLibrary = tab.dataset.materialLibrary;
    libraryTabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    document.querySelector('#materialLibraryContent').setAttribute('aria-labelledby', tab.id);
    render();
  }
  libraryTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectLibrary(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? libraryTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + libraryTabs.length) % libraryTabs.length;
      selectLibrary(libraryTabs[next]);
      libraryTabs[next].focus();
    });
  });
  q('#createMaterialMenu').addEventListener('click', event => { try { openMenu(event.currentTarget, createMenuItems(contextNow())); } catch (error) { showToast(error.message, 'error'); } });
  panel.addEventListener('pointerdown', event => {
    dragFromMenu = Boolean(event.target.closest('[data-material-menu]'));
    dragClickGuardUntil = 0;
  });
  panel.addEventListener('dragstart', event => {
    const source = event.target.closest('[data-drag-material]');
    if (!source) return;
    if (dragFromMenu || !event.dataTransfer) { event.preventDefault(); return; }
    try {
      const context = contextNow(), id = source.dataset.dragMaterial;
      const item = getItem(context, 'material', id);
      if (recordFolder(item, context, foldersFor(context)) !== context.folderId) throw new Error('素材位置已变化，请刷新后重试');
      clearMaterialDrag(); closeMenu();
      event.dataTransfer.setData('application/x-orchestra-material', id);
      event.dataTransfer.effectAllowed = 'move';
      materialDrag = { id, context, source, target: null };
      source.classList.add('is-dragging');
      panel.classList.add('material-drag-active');
    } catch (error) { event.preventDefault(); clearMaterialDrag(); showToast(error.message, 'error'); }
  });
  panel.addEventListener('dragenter', handleMaterialDragOver);
  panel.addEventListener('dragover', handleMaterialDragOver);
  panel.addEventListener('dragleave', event => {
    const target = materialDrag?.target;
    if (target && event.target === target && !target.contains(event.relatedTarget)) setMaterialDropTarget(null);
  });
  panel.addEventListener('drop', event => {
    if (!materialDrag) return;
    event.preventDefault(); event.stopPropagation();
    const target = event.target.closest('[data-drop-material-folder]');
    if (!target) { clearMaterialDrag(); return; }
    try {
      const { context, item, folder } = materialDropDestination(target.dataset.dropMaterialFolder);
      performMove(context, 'material', item.id, folder.id);
      clearMaterialDrag(); render();
      showToast(`已移入「${folder.title}」`);
    } catch (error) { clearMaterialDrag(); showToast(error.message || '移动失败，请重试', 'error'); }
  });
  panel.addEventListener('click', async event => {
    if (event.detail && Date.now() < dragClickGuardUntil) { event.preventDefault(); event.stopPropagation(); return; }
    const menu = event.target.closest('[data-material-menu]');
    if (menu) { event.preventDefault(); try { openCardMenu(menu); } catch (error) { showToast(error.message, 'error'); } return; }
    const folder = event.target.closest('[data-open-material-folder]');
    if (folder) { openFolder(folder.dataset.openMaterialFolder); return; }
    const action = event.target.closest('[data-preview-material]');
    if (!action) return;
    try {
      const id = action.dataset.previewMaterial;
      const record = visibleRecords(contextNow()).find(item => item.id === id);
      if (!record) throw new Error('素材已不存在，请刷新后重试');
      await openPreview(record);
    } catch (error) { showToast(error.message, 'error'); }
  });
  panel.addEventListener('play', event => {
    if (event.target.tagName !== 'AUDIO') return;
    document.querySelectorAll('audio').forEach(audio => { if (audio !== event.target) audio.pause(); });
  }, true);
  new MutationObserver(render).observe(document.querySelector('#assetsPage'), { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => { if (panel.hidden) { clearMaterialDrag(); stopAudio(); closeMenu(); } }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  document.querySelectorAll('.workspace-option').forEach(button => button.addEventListener('click', render));
  window.addEventListener('pagehide', releasePreviews);
  window.addEventListener('pagehide', clearMaterialDrag);
  window.addEventListener('blur', clearMaterialDrag);
  document.addEventListener('dragend', clearMaterialDrag);
  document.addEventListener('dragover', event => { if (materialDrag && !panel.contains(event.target)) setMaterialDropTarget(null); });
  document.addEventListener('drop', clearMaterialDrag);
  window.addEventListener('storage', event => { if ([storageKey(activeTeam()), folderStorageKey(activeTeam())].includes(event.key)) render(); });
  document.addEventListener('pointerdown', event => { if (activeMenu && !insideActiveMenu(event.target)) closeMenu(); });
  window.addEventListener('resize', () => closeMenu());
  document.addEventListener('scroll', event => { if (activeMenu && !insideActiveMenu(event.target)) closeMenu(); }, true);
  window.orchestraMaterialLibrary = { hasSaved, save };
  render();
})();
