/* Two-level folders; local uploads use IndexedDB, metadata stays in the existing catalog. */
(() => {
  const panel = document.querySelector('#assetMaterialsPanel');
  const assetsPage = document.querySelector('#assetsPage');
  const onTimbreTab = () => selectedLibrary === 'timbre' && assetsPage.classList.contains('active');
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
  const locations = new Map(), searches = new Map(), previewUrls = new Set();
  const q = selector => panel.querySelector(selector);
  const libraryName = library => library === 'personal' ? '个人素材库' : '团队素材库';
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
  const normalizeSearch = value => String(value || '').normalize('NFKC').trim().toLocaleLowerCase();
  const newestFirst = (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
  const searchTerm = context => normalizeSearch(searches.get(locationKey(context)));
  function updateMaterialSearch(event) {
    const key = locationKey(contextNow()), value = event.currentTarget.value;
    if (value) searches.set(key, value); else searches.delete(key);
    if (!event.isComposing) render();
  }
  function clearMaterialSearch() {
    searches.delete(locationKey(contextNow()));
    render();
    q('#materialSearch')?.focus();
  }
  const recordId = (task, candidate) => JSON.stringify([task.id, candidate.generationId || candidate.id]);
  const folderIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/></svg>';
  const folderArtwork = '<svg class="material-folder-art" viewBox="0 0 120 98" aria-hidden="true"><path class="folder-back" d="M0 16Q0 0 16 0H28Q35 0 42 5L53 10H104Q120 10 120 26V82Q120 98 104 98H16Q0 98 0 82Z"/><path class="folder-front" d="M0 32Q0 18 14 18H106Q120 18 120 32V84Q120 98 106 98H14Q0 98 0 84Z"/></svg>';
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
    }).map(record => ({ ...record, title: record.namesByLibrary?.[scopeKey(context)] || record.title, content: record.contentsByLibrary?.[scopeKey(context)] ?? record.content }));
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
  function titleValue(value, limit = 50) {
    const title = value.trim();
    if (!title) throw new Error('请输入名称');
    if (Array.from(title).length > limit) throw new Error(`名称不能超过 ${limit} 个字符`);
    return title;
  }
  function persist(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { throw new Error('保存失败，浏览器存储空间不足或不可用，请重试'); }
  }
  function createFolder(context, value) {
    const title = titleValue(value, 20), folders = foldersFor(context);
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
  function teamTransferReason(context, id) {
    if (context.account !== currentAccount() || context.team !== activeTeam()) return '当前账号或团队已变更，请关闭弹窗后重试';
    if (context.library !== 'personal') return '仅支持将个人素材转移至团队素材库，团队素材不能转回个人素材库';
    const item = visibleRecords(context).find(record => record.id === id);
    if (!item) return '素材已不存在或已转移，请刷新后重试';
    if (item.savedBy !== context.account) return '仅素材归属人可转移个人素材';
    let role;
    try {
      const memberships = JSON.parse(localStorage.getItem('orchestra-account-organizations:' + context.account) || localStorage.getItem('orchestra-login-organizations') || 'null');
      role = Array.isArray(memberships) ? memberships.find(team => team.id === context.team)?.role : document.querySelector('.workspace-option.active')?.dataset.workspaceStatus;
    } catch { return '无法确认团队权限，请重新登录后重试'; }
    return ['团队最高管理员', '团队管理员'].includes(role) ? '' : '仅团队管理员可将个人素材转移至团队素材库';
  }
  function transferMaterialToTeam(context, id, targetId, original) {
    const reason = teamTransferReason(context, id);
    if (reason) throw new Error(reason);
    const records = read(context.team), raw = records.find(record => record.id === id);
    if (original && JSON.stringify(raw) !== original) throw new Error('素材已更新，请关闭弹窗后重新选择');
    const item = getItem(context, 'material', id), target = { ...context, library: 'team', folderId: targetId || null };
    requireMaterialLocation(target);
    const transferred = { ...raw, library: 'team', title: item.title,
      ...(item.type === 'text' ? { content: item.content } : {}),
      folderIds: { team: target.folderId }, namesByLibrary: { team: item.title },
      contentsByLibrary: item.type === 'text' ? { team: item.content } : {}, deletedIn: [],
      transferredBy: context.account, transferredAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    // One metadata write changes ownership and placement together; the original file and ID stay intact.
    persist(storageKey(context.team), records.map(record => record.id === id ? transferred : record));
    return transferred;
  }
  function transferFolderPickerMarkup(context) {
    const folders = foldersFor({ ...context, library: 'team' });
    const option = (id, title) => `<label class="material-save-folder-option"><input type="radio" name="transferDestination" value="${escapeHtml(id)}" required><span class="material-save-folder-icon" aria-hidden="true">${folderIcon}</span><span>${escapeHtml(title)}</span></label>`;
    const children = (parentId, depth = 0) => depth >= 2 ? '' : folders.filter(folder => folder.parentId === parentId).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN')).map(folder => {
      const nested = children(folder.id, depth + 1);
      return `<li>${option(folder.id, folder.title)}${nested ? `<ul>${nested}</ul>` : ''}</li>`;
    }).join('');
    return `<div class="material-save-library-folders">${option('root', '团队素材库（根目录）')}<ul>${children(null)}</ul></div>`;
  }
  function openTransferToTeam(context, id) {
    const reason = teamTransferReason(context, id);
    if (reason) throw new Error(reason);
    const item = getItem(context, 'material', id), original = JSON.stringify(read(context.team).find(record => record.id === id));
    const dialog = openDialog('转移至团队素材库', `
      <p class="material-dialog-hint">将「${escapeHtml(item.title)}」转移至当前团队，请选择目标位置。</p>
      <div class="material-save-folder-heading"><span id="materialTransferLocationTitle">目标位置 <em>*</em></span></div>
      <div class="material-save-tree" role="group" aria-labelledby="materialTransferLocationTitle" aria-describedby="materialTransferNotice">${transferFolderPickerMarkup(context)}</div>
      <p id="materialTransferNotice" class="material-dialog-hint">确认后，该素材将从个人素材库移出。团队内所有成员均可使用和引用，仅团队管理员可管理，且不能再转回个人素材库。</p>`, '确认转移', form => {
      const selected = form.querySelector('input[name="transferDestination"]:checked');
      if (!selected) throw new Error('请选择团队素材库中的目标位置');
      const targetId = selected.value === 'root' ? null : selected.value;
      transferMaterialToTeam(context, id, targetId, original);
      showToast(`已转移至「${destinationLabel({ ...context, library: 'team', folderId: targetId })}」`);
    });
    return dialog;
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
    const item = getItem(context, kind, id), title = titleValue(value, kind === 'folder' ? 20 : 50);
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
  function validateUpload(file) {
    if (!file || !file.size) throw new Error('请选择非空的图片或音频文件');
    if (file.size > 50 * 1024 * 1024) throw new Error(`「${file.name}」超过 50 MB，请重新选择`);
    return uploadType(file);
  }
  async function uploadFiles(context, entries) {
    if (!entries.length || entries.length > 10) throw new Error('一次请选择 1～10 个文件');
    const checked = entries.map(entry => ({ ...entry, type: validateUpload(entry.file), title: titleValue(entry.title) }));
    const verifyContext = () => {
      if (context.account !== currentAccount() || context.team !== activeTeam()) throw new Error('账号或团队已变更，请重新打开添加素材');
      requireMaterialLocation(context);
    };
    verifyContext();
    const records = [], blobs = [];
    try {
      for (const entry of checked) {
        const blobId = crypto.randomUUID(); blobs.push(blobId);
        await fileOperation('put', blobId, entry.file);
        records.push({ id: crypto.randomUUID(), type: entry.type, title: entry.title, blobId, fileName: entry.file.name, size: entry.file.size, library: context.library, savedBy: context.account, folderIds: { [scopeKey(context)]: context.folderId || null }, createdAt: new Date().toISOString() });
      }
      verifyContext();
      persist(storageKey(context.team), [...records, ...read(context.team)]);
      return records;
    } catch (error) {
      await Promise.all(blobs.map(id => fileOperation('delete', id).catch(() => {})));
      throw error;
    }
  }
  function hasSaved(task, candidate) {
    try {
      const context = { team: taskTeam(task), account: currentAccount() }, sourceId = recordId(task, candidate);
      return ['personal', 'team'].some(library => visibleRecords({ ...context, library }).some(record => (record.sourceId || record.id) === sourceId));
    }
    catch { return false; }
  }
  const saveLibraryName = library => library === 'personal' ? '个人素材库' : '团队素材库';
  function saveDestinationLabel(context) {
    return [saveLibraryName(context.library), ...folderPath(context).map(folder => folder.title)].join(' / ');
  }
  function saveFolderPickerMarkup(context) {
    return ['personal', 'team'].map(library => {
      const root = { ...context, library }, folders = foldersFor(root), expanded = context.library === library;
      const children = (parentId, depth = 0) => {
        if (depth >= 2) return '';
        return folders.filter(folder => folder.parentId === parentId).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN')).map(folder => {
          const selected = expanded && context.folderId === folder.id;
          const nested = children(folder.id, depth + 1);
          return `<li><label class="material-save-folder-option"><input type="radio" name="saveDestination" value="${escapeHtml(folder.id)}" data-save-folder data-save-library="${library}" ${selected ? 'checked' : ''}><span class="material-save-folder-icon" aria-hidden="true">${folderIcon}</span><span>${escapeHtml(folder.title)}</span></label>${nested ? `<ul>${nested}</ul>` : ''}</li>`;
        }).join('');
      };
      const contents = children(null);
      return `<section class="material-save-library"><button type="button" class="material-save-library-root" data-save-library-switch="${library}" aria-expanded="${expanded}" aria-controls="materialSaveFolders-${library}"><span aria-hidden="true">${expanded ? '⌄' : '›'}</span><span class="material-save-folder-icon" aria-hidden="true">${folderIcon}</span>${saveLibraryName(library)}</button><div id="materialSaveFolders-${library}" class="material-save-library-folders" ${expanded ? '' : 'hidden'}>${contents ? `<ul>${contents}</ul>` : '<p class="material-dialog-hint">暂无文件夹，请先到素材库创建文件夹，再返回选择保存位置。</p>'}</div></section>`;
    }).join('');
  }
  function taskResultPayload(task,candidate){
    if(!task?.candidates?.includes(candidate))throw new Error('该资源已更新，请关闭弹窗后重新选择');
    if(['refLyrics','aiLyrics'].includes(task.nodeType)){
      const content=task.selectedCandidateId===candidate.id?(task.selectedCandidateText??candidate.content):candidate.content;
      if(typeof content!=='string'||!content.trim())throw new Error('歌词内容不能为空');
      return {type:'text',content};
    }
    if(['aiSong','refSong','sampleSong','playlistSong'].includes(task.nodeType)&&candidate.url)return {type:'audio',url:candidate.url,durationSeconds:candidate.durationSeconds};
    throw new Error('该资源已更新，请关闭弹窗后重新选择');
  }
  function saveSongToFolder(task, candidate, context, value) {
    if (context.account !== currentAccount() || context.team !== activeTeam() || context.team !== taskTeam(task)) throw new Error('当前账号或团队已变更，请关闭弹窗后重试');
    const payload=taskResultPayload(task,candidate);
    if (!['personal', 'team'].includes(context.library)) throw new Error('请选择素材库');
    if (!context.folderId) throw new Error('请选择具体的保存文件夹');
    const title = value.trim();
    if (Array.from(title).length > 50) throw new Error('素材名称不能超过 50 个字符');
    titleValue(title);
    requireMaterialLocation(context);
    if (hasSaved(task, candidate)) throw new Error('该资源已保存至素材库，请关闭弹窗后查看');
    return addMaterial(context, {
      sourceId: recordId(task, candidate), title, ...payload,
      taskId: task.id, runId: task.workId, projectId: task.projectId,
      projectName: task.projectName, planName: task.planName, nodeTitle: task.nodeTitle
    });
  }
  async function save(task, candidate) {
    try {
      taskResultPayload(task,candidate);
      if (hasSaved(task, candidate)) { showToast('该资源已保存至素材库'); return true; }
      const base = { team: taskTeam(task), account: currentAccount(), folderId: null };
      return await new Promise(resolve => {
        let saved = false;
        const dialog = openDialog('保存至素材库', `
          <p class="material-dialog-hint">选择已有文件夹作为保存位置，并为素材命名。</p>
          <input type="hidden" name="library" value="personal"><input type="hidden" name="folderId" value="">
          <div class="material-save-folder-heading"><span id="materialSaveLocationTitle">保存位置 <em>*</em></span></div>
          <div class="material-save-tree" data-save-folder-tree role="group" aria-labelledby="materialSaveLocationTitle" aria-describedby="materialSavePath"></div>
          <p id="materialSavePath" class="material-dialog-hint" role="status"></p>
          <label>素材名称 <span>*</span><input name="title" required maxlength="100" autocomplete="off" placeholder="请输入素材名称" aria-describedby="materialSaveNameHint"></label>
          <p id="materialSaveNameHint" class="material-save-name-hint"><span>不超过 50 个字符，支持特殊符号</span><span data-save-name-count aria-live="polite">0 / 50</span></p>`, '确认保存', form => {
          const context = { ...base, library: form.elements.library.value, folderId: form.elements.folderId.value };
          saveSongToFolder(task, candidate, context, form.elements.title.value);
          saved = true;
          showToast(`已保存至「${saveDestinationLabel(context)}」`);
        });
        dialog.addEventListener('close', () => resolve(saved), { once: true });
        const form = dialog.querySelector('form'), { library, folderId, title } = form.elements;
        const error = dialog.querySelector('.material-dialog-error'), tree = dialog.querySelector('[data-save-folder-tree]');
        const context = () => ({ ...base, library: library.value, folderId: folderId.value || null });
        const updatePath = () => {
          dialog.querySelector('#materialSavePath').textContent = folderId.value
            ? `保存至：${saveDestinationLabel(context())}` : `请在${saveLibraryName(library.value)}中选择具体文件夹。`;
        };
        const updateFolders = (selected = '') => {
          const folders = foldersFor(context());
          folderId.value = folders.some(folder => folder.id === selected) ? selected : '';
          tree.innerHTML = saveFolderPickerMarkup(context());
          updatePath();
        };
        const changeLocation = action => {
          error.textContent = '';
          try { action(); } catch (failure) { error.textContent = failure.message; }
        };
        tree.addEventListener('click', event => {
          const button = event.target.closest('[data-save-library-switch]');
          if (!button) return;
          changeLocation(() => {
            const selected = library.value === button.dataset.saveLibrarySwitch ? folderId.value : '';
            library.value = button.dataset.saveLibrarySwitch;
            updateFolders(selected);
            tree.querySelector(`[data-save-library-switch="${library.value}"]`)?.focus();
          });
        });
        tree.addEventListener('change', event => {
          const choice = event.target.closest('[data-save-folder]');
          if (!choice?.checked || choice.dataset.saveLibrary !== library.value) return;
          changeLocation(() => { folderId.value = choice.value; updatePath(); });
        });
        const updateName = () => {
          const length = Array.from(title.value).length;
          title.setCustomValidity(length > 50 ? '素材名称不能超过 50 个字符' : '');
          dialog.querySelector('[data-save-name-count]').textContent = `${length} / 50`;
          dialog.querySelector('[data-save-name-count]').classList.toggle('is-over-limit', length > 50);
        };
        title.value = Array.from(candidate.title?.trim() || '').slice(0, 50).join('');
        title.addEventListener('input', updateName);
        updateName(); changeLocation(updateFolders);
      });
    } catch (error) { showToast(error.message || '保存失败，请重试', 'error'); return false; }
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
    if (record.type === 'text') return `<button type="button" class="material-text-preview" data-preview-material="${id}" aria-label="编辑文本：${title}"><svg class="material-document-symbol" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h15l10 10v22a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z M29 4v10h10 M17 20h10 M17 27h15 M17 33h15"/><path d="M10 11H8a4 4 0 0 0-4 4v25a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4"/></svg></button>`;
    const source = record.blobId ? `data-blob-preview="${escapeHtml(record.blobId)}"` : `src="${escapeHtml(record.url || '')}"`;
    if (record.type === 'image') return `<button type="button" class="material-image-preview" data-preview-material="${id}" aria-label="查看图片：${title}"><img ${source} alt="${title}" draggable="false"></button>`;
    return `<button type="button" class="material-audio-preview" data-preview-material="${id}" aria-label="试听音频：${title}">${audioSymbol()}</button>`;
  }
  function audioSymbol() {
    return '<svg class="material-audio-symbol" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 17V3c1 6 7 4 8 10 M23 36V21l20-6v20 M23 27l20-6"/><ellipse cx="6" cy="19" rx="4" ry="5"/><ellipse cx="19" cy="38" rx="5" ry="6"/><ellipse cx="39" cy="37" rx="5" ry="6"/></svg>';
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
  const timbreStorageKey = (team = activeTeam()) => 'orchestra-timbres-team-v2:' + team;
  const timbreFolderKey = (team = activeTeam()) => 'orchestra-timbre-folders-team-v2:' + team;
  const timbreFilters = new Map();
  function timbreContext() { return { team: activeTeam(), account: currentAccount() }; }
  function timbreManagementReason(context = timbreContext()) {
    if (context.team !== activeTeam() || context.account !== currentAccount()) return '账号或团队已切换，请重新操作';
    try {
      const raw = localStorage.getItem('orchestra-account-organizations:' + context.account) || localStorage.getItem('orchestra-login-organizations');
      const memberships = raw ? JSON.parse(raw) : null;
      const role = Array.isArray(memberships) ? memberships.find(item => item.id === context.team)?.role : document.querySelector('.workspace-option.active')?.dataset.workspaceStatus;
      return ['团队最高管理员', '团队管理员'].includes(role) ? '' : '仅团队管理员可管理音色库，团队成员可使用生成成功的音色';
    } catch { return '无法确认团队权限，请重新登录后重试'; }
  }
  function requireTimbreAccess(context = timbreContext()) {
    if (context.team !== activeTeam() || context.account !== currentAccount()) throw Error('账号或团队已切换，请重新操作');
    const raw = localStorage.getItem('orchestra-account-organizations:' + context.account) || localStorage.getItem('orchestra-login-organizations');
    let memberships;
    try { memberships = raw ? JSON.parse(raw) : null; } catch { throw Error('无法确认团队权限，请重新登录'); }
    if (Array.isArray(memberships) ? !memberships.some(item => item.id === context.team) : !document.querySelector('.workspace-option.active')) throw Error('仅当前团队成员可使用音色库');
  }
  function requireTimbreManagement(context = timbreContext()) {
    const reason = timbreManagementReason(context); if (reason) throw Error(reason);
  }
  function migrateTeamTimbres(team = activeTeam()) {
    const marker = 'orchestra-timbres-team-migrated-v2:' + team;
    if (localStorage.getItem(marker)) return;
    const recordKey = timbreStorageKey(team), folderKey = timbreFolderKey(team);
    const records = new Map(JSON.parse(localStorage.getItem(recordKey) || '[]').map(item => [item.id, item]));
    const folders = new Map(JSON.parse(localStorage.getItem(folderKey) || '[]').map(item => [item.id, item]));
    const collect = (map, items, account) => items.forEach(item => {
      const current = map.get(item.id), time = value => Date.parse(value.updatedAt || value.completedAt || value.createdAt) || 0;
      if (!current || time(item) > time(current)) map.set(item.id, { ...item, savedBy: item.savedBy || account });
    });
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      for (const [prefix, destination] of [['orchestra-timbres-v1:', records], ['orchestra-timbre-folders-v1:', folders]]) {
        if (!key?.startsWith(prefix)) continue;
        const scope = JSON.parse(key.slice(prefix.length));
        if (!Array.isArray(scope) || scope[0] !== team) continue;
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(items)) throw Error('原音色数据读取失败，请重试');
        collect(destination, items, scope[1]);
      }
    }
    localStorage.setItem(folderKey, JSON.stringify([...folders.values()]));
    localStorage.setItem(recordKey, JSON.stringify([...records.values()]));
    localStorage.setItem(marker, '1');
  }
  function readTimbres(key = timbreStorageKey()) {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(items)) throw Error('音色库读取失败，请重试');
    return items;
  }
  const timbreFolderLocations = new Map();
  function readTimbreFolders(key = timbreFolderKey()) {
    const folders = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(folders)) throw Error('音色文件夹读取失败，请重试');
    return folders;
  }
  function timbreFolderPath(folders, id) {
    const path = [], seen = new Set();
    while (id) {
      if (seen.has(id)) throw Error('文件夹层级异常，请刷新后重试');
      seen.add(id);
      const folder = folders.find(item => item.id === id);
      if (!folder) throw Error('文件夹已不存在，请返回音色库');
      path.unshift(folder); id = folder.parentId;
    }
    return path;
  }
  function addTimbreFolder(context, parentId, name) {
    requireTimbreManagement(context);
    name = String(name || '').trim();
    if (!name) throw Error('请输入文件夹名称');
    if (Array.from(name).length > 20) throw Error('文件夹名称不能超过 20 个字符');
    const key = timbreFolderKey(context.team, context.account), folders = readTimbreFolders(key);
    if (timbreFolderPath(folders, parentId).length >= 2) throw Error('最多支持两级文件夹，根目录不计入层级');
    if (folders.some(folder => (folder.parentId || null) === parentId && folder.name === name)) throw Error('当前位置已有同名文件夹，请更换名称');
    const folder = { id: crypto.randomUUID(), parentId, name, createdAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify([...folders, folder]));
    return folder;
  }
  function openTimbreFolderForm() {
    const context = timbreContext(), key = timbreFolderKey();
    requireTimbreManagement(context);
    const parentId = timbreFolderLocations.get(key) || null;
    if (timbreFolderPath(readTimbreFolders(key), parentId).length >= 2) throw Error('最多支持两级文件夹，根目录不计入层级');
    openDialog('新建文件夹', '<label>文件夹名称 <span>*</span><input name="title" required maxlength="40" data-name-limit="20" autocomplete="off" autofocus placeholder="请输入文件夹名称"></label><p class="material-dialog-hint">名称不超过 20 个字符。根目录下最多支持两级文件夹。</p>', '创建', form => {
      addTimbreFolder(context, parentId, form.elements.title.value);
      showToast('文件夹已创建');
    });
  }
  q('#timbreLibraryContent').addEventListener('click', async event => {
    try {
      if (event.target.closest('[data-create-library-timbre]')) { await openLibraryTimbreCreation(); return; }
      const create = event.target.closest('[data-create-timbre-folder]');
      if (create) { if (!create.disabled) openTimbreFolderForm(); return; }
      const target = event.target.closest('[data-open-timbre-folder]');
      if (!target) return;
      const id = target.dataset.openTimbreFolder || null;
      timbreFolderPath(readTimbreFolders(), id);
      timbreFolderLocations.set(timbreFolderKey(), id); render();
    } catch (error) { showToast(error.message, 'error'); }
  });
  const timbreJobs = new Map(), timbreUnpersistedJobs = new Set();
  const timbreStateLabels = {
    'song-generating': '歌曲生成中', 'song-failed': '歌曲生成失败',
    confirming: '待确认',
    generating: '音色生成中', succeeded: '生成成功', failed: '音色生成失败'
  };
  let openingLibraryTimbre = false;
  function timbreStatus(item) {
    if (item.status === 'failed' && item.draft) return 'song-failed';
    return item.status || (item.blobId || item.url ? 'succeeded' : 'failed');
  }
  function refreshTimbreScope(key) {
    if (key === timbreStorageKey() && onTimbreTab()) render();
  }
  function runTimbreJob(key, id) {
    const jobKey = JSON.stringify([key, id]);
    if (timbreUnpersistedJobs.has(jobKey)) return;
    if (timbreJobs.has(jobKey)) return timbreJobs.get(jobKey);
    const promise = (async () => {
      let blobId = null, attemptId;
      try {
        const item = readTimbres(key).find(record => record.id === id);
        if (!item || timbreStatus(item) !== 'generating') return;
        attemptId = item.attemptId;
        // Local prototype: reuse the source as preview audio; no real voice extraction service.
        await new Promise(resolve => setTimeout(resolve, 5000));
        const blob = await materialBlob({ ...item.source, type: 'audio' });
        if (!blob?.size) throw Error('原音频不可用，请重试');
        blobId = 'timbre:' + id + ':' + attemptId + ':' + crypto.randomUUID();
        await fileOperation('put', blobId, blob);
        const records = readTimbres(key), current = records.find(record => record.id === id);
        if (!current || current.attemptId !== attemptId || timbreStatus(current) !== 'generating') {
          await fileOperation('delete', blobId); blobId = null; return;
        }
        localStorage.setItem(key, JSON.stringify(records.map(record => record.id === id ? { ...record, status: 'succeeded', blobId, error: '', completedAt: new Date().toISOString() } : record)));
        blobId = null;
      } catch (error) {
        if (blobId) await fileOperation('delete', blobId).catch(() => {});
        try {
          const records = readTimbres(key);
          localStorage.setItem(key, JSON.stringify(records.map(record => record.id === id && record.attemptId === attemptId && timbreStatus(record) === 'generating' ? { ...record, status: 'failed', error: error.message || '音色生成失败，请重试', updatedAt: new Date().toISOString() } : record)));
        } catch {
          timbreUnpersistedJobs.add(jobKey);
          if (key === timbreStorageKey()) showToast('音色状态保存失败，请检查浏览器存储空间后刷新重试', 'error');
        }
      } finally {
        timbreJobs.delete(jobKey);
        refreshTimbreScope(key);
      }
    })();
    timbreJobs.set(jobKey, promise);
    return promise;
  }
  function resumeTimbreJobs() {
    migrateTeamTimbres();
    const key = timbreStorageKey();
    for (const item of readTimbres(key)) {
      const status = timbreStatus(item);
      if (status === 'generating') runTimbreJob(key, item.id);
      if (status === 'song-generating') runSongDraftJob(key, item.id).catch(() => {});
    }
  }
  function submitTimbreGeneration(context, source, name, style, { draftRecord, generationConfig }) {
    requireTimbreManagement(context);
    migrateTeamTimbres(context.team);
    name = titleValue(name);
    style = String(style || '').trim();
    if (!style) throw Error('请输入音色风格');
    if (Array.from(style).length > 200) throw Error('风格不能超过 200 个字符');
    const key = timbreStorageKey(context.team), records = readTimbres(key);
    const previous = records.find(record => record.id === draftRecord.id);
    if (previous?.status !== 'confirming' || previous.draft?.revision !== draftRecord.draft.revision) throw Error('该任务已更新，请重新打开');
    const item = {
      id: previous.id, name, style,
      source: { id: source.id, title: source.title, url: source.url, blobId: source.blobId },
      sourceName: source.title, sourceId: source.id,
      status: 'generating', attemptId: crypto.randomUUID(), generationConfig,
      createdAt: previous.createdAt, savedBy: previous.savedBy, folderId: previous.folderId, demo: true
    };
    localStorage.setItem(key, JSON.stringify(records.map(record => record.id === item.id ? item : record)));
    runTimbreJob(key, item.id);
  }
  function runSongDraftJob(key, id) {
    const jobKey = JSON.stringify(['song', key, id]);
    if (timbreUnpersistedJobs.has(jobKey)) return Promise.reject(Error('歌曲状态无法保存，请刷新后重试'));
    if (timbreJobs.has(jobKey)) return timbreJobs.get(jobKey);
    const started = readTimbres(key).find(item => item.id === id && item.status === 'song-generating');
    if (!started?.draft) return Promise.reject(Error('歌曲生成任务已变更，请重新打开'));
    const finish = (status, candidates, error = '') => {
      const records = readTimbres(key);
      const current = records.find(item => item.id === id);
      if (current?.attemptId !== started.attemptId) return null;
      if (current.status !== 'song-generating') return current;
      const next = { ...current, status, error, updatedAt: new Date().toISOString(), draft: { ...current.draft, candidates } };
      localStorage.setItem(key, JSON.stringify(records.map(item => item.id === id ? next : item)));
      return next;
    };
    const job = (async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1600));
        const config = started.draft.config;
        const audio = await fileOperation('get', config.reference?.blobId);
        if (!audio?.size) throw Error('参考音频不可用，请重新选择后生成歌曲');
        const demoSongs = window.orchestraReferenceSongTask?.candidates;
        if (!demoSongs) throw Error('歌曲生成暂时不可用，请重试');
        const name = Array.from(config.reference.title.replace(/\.[a-z0-9]+$/i, '').trim() || '参考音频').slice(0, 42).join('');
        const results = demoSongs(false, config.count);
        if (!Array.isArray(results) || results.length !== config.count || results.some(result => !result.url)) throw Error('歌曲生成结果不完整，请重试');
        const candidates = results.map((candidate, index) => ({
          ...candidate, id: `${started.attemptId}:${index + 1}`, title: `${name} · 版本 ${index + 1}`
        }));
        const completed = finish('confirming', candidates);
        if (completed?.status !== 'confirming') throw Error('歌曲生成任务已变更，请重新打开');
        return completed.draft.candidates;
      } catch (error) {
        try { finish('failed', [], error.message || '歌曲生成失败，请重试'); }
        catch { timbreUnpersistedJobs.add(jobKey); }
        throw error;
      } finally {
        timbreJobs.delete(jobKey);
        refreshTimbreScope(key);
      }
    })();
    timbreJobs.set(jobKey, job);
    return job;
  }

  async function openLibraryTimbreCreation(existingId, songExample) {
    if (openingLibraryTimbre || document.querySelector('.timbre-creation[open]')) return;
    const context = timbreContext();
    requireTimbreManagement(context);
    const studio = window.orchestraTimbreCreation, picker = window.orchestraTaskAudioPicker;
    if (!studio || !picker || !window.orchestraReferenceSongTask?.candidates) throw Error('创建音色暂时不可用，请刷新后重试');
    const key = timbreStorageKey(context.team), id = existingId || crypto.randomUUID();
    const original = existingId ? readTimbres(key).find(item => item.id === id) : null;
    if (existingId && (!original?.draft || original.status === 'song-generating')) throw Error('当前任务暂时不可继续');
    const folderId = original?.folderId ?? timbreFolderLocations.get(timbreFolderKey(context.team)) ?? null;
    let revision = original?.draft?.revision;
    let dialog, unsavedAudioId;
    const isCurrent = () => onTimbreTab() && !timbreManagementReason(context) && (!dialog || dialog.open);
    const discardAudio = blobId => {
      if (blobId) fileOperation('delete', blobId).catch(() => {});
    };
    function writableDraft() {
      requireTimbreManagement(context);
      const current = readTimbres(key).find(item => item.id === id);
      if (current && (!current.draft || current.status === 'song-generating' || current.draft.revision !== revision)) {
        throw Error('该任务已更新，请关闭后重新打开');
      }
      return current;
    }
    function saveDraft({ config, candidates, selectedId, name, style }) {
      const current = writableDraft();
      const reference = config.reference || (candidates.length ? current?.draft.config.reference : null);
      const previousAudioId = current?.draft.config.reference?.blobId;
      const nextRevision = crypto.randomUUID();
      const next = {
        ...current, id, name: name || '未命名音色', style,
        folderId: current ? current.folderId : folderId,
        savedBy: current?.savedBy || context.account,
        createdAt: current?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(), status: candidates.length ? 'confirming' : 'draft', error: '',
        draft: {
          config: { ...config, reference: reference ? { id: reference.id, title: reference.title, sourceLibrary: reference.sourceLibrary, blobId: reference.blobId } : null },
          candidates, selectedId, name, style, revision: nextRevision
        }
      };
      const records = readTimbres(key);
      localStorage.setItem(key, JSON.stringify(current ? records.map(item => item.id === id ? next : item) : [next, ...records]));
      revision = nextRevision;
      if (unsavedAudioId === reference?.blobId) unsavedAudioId = null;
      if (previousAudioId !== reference?.blobId) discardAudio(previousAudioId);
    }
    openingLibraryTimbre = true;
    try {
      let initialDraft = null;
      if (original?.draft) {
        const savedReference = original.draft.config.reference;
        const blob = savedReference?.blobId ? await fileOperation('get', savedReference.blobId).catch(() => null) : null;
        initialDraft = {
          ...original.draft,
          config: { ...original.draft.config, reference: blob?.size ? { ...savedReference, blob } : null },
          status: original.status,
          error: original.error || (savedReference && !blob?.size ? '参考音频不可用，可重新选择。' : '')
        };
        writableDraft();
      } else if (songExample) {
        const config = songExample.generationConfig;
        const reference = { ...config.reference, title: '微光回声 · 示例参考音频.wav', sourceLibrary: 'demo', url: exampleSongs[0].url };
        const blob = await materialBlob(reference);
        if (!blob?.size) throw Error('无法读取示例参考音频，请重试');
        const blobId = 'timbre-draft-reference:' + crypto.randomUUID();
        await fileOperation('put', blobId, blob);
        unsavedAudioId = blobId;
        initialDraft = {
          config: { ...config, reference: { ...reference, blob, blobId } },
          name: songExample.status === 'confirming' ? '微光回声 · 候选确认' : '微光回声 · 歌曲重试',
          style: songExample.style, candidates: songExample.candidates,
          status: songExample.status, error: songExample.error
        };
      }
      if (!isCurrent()) throw Error('账号或团队已切换，请重新打开创建音色');
      dialog = studio.open({
        isCurrent, initialDraft, saveDraft,
        onClose() { discardAudio(unsavedAudioId); refreshTimbreScope(key); },
        async chooseReference() {
          writableDraft();
          const [selection] = await picker.open({ max: 1, includeWorkflow: false, title: '选择参考音频', isCurrent }) || [];
          if (!selection) return null;
          const blob = selection.kind === 'file' ? selection.file : await materialBlob(selection.record);
          if (!isCurrent()) throw Error('账号或团队已切换，请重新选择参考音频');
          if (!blob?.size) throw Error('无法读取参考音频，请重新选择');
          const blobId = 'timbre-draft-reference:' + crypto.randomUUID();
          await fileOperation('put', blobId, blob);
          if (!isCurrent()) { discardAudio(blobId); return null; }
          discardAudio(unsavedAudioId);
          unsavedAudioId = blobId;
          return {
            title: selection.record?.title || selection.file?.name || '参考音频',
            id: selection.record?.id || '', sourceLibrary: selection.record?.sourceLibrary || 'upload', blob, blobId
          };
        },
        generate(config) {
          let current = writableDraft();
          if (!current && songExample) {
            const { name, style } = initialDraft;
            saveDraft({ config, name, style, candidates: [], selectedId: null });
            current = writableDraft();
          }
          if (!current?.draft.config.reference?.blobId || config.reference?.blobId !== current.draft.config.reference.blobId) throw Error('请选择并保存参考音频');
          if (!config.lyrics?.trim() || !config.prompt?.trim()) throw Error('请填写歌词和提示词');
          if (config.model !== 'hawk-v6' || ![2, 4].includes(config.count)) throw Error('请选择有效的模型版本和生成数量');
          const next = {
            ...current, status: 'song-generating', error: '', attemptId: crypto.randomUUID(), updatedAt: new Date().toISOString(),
            draft: { ...current.draft, config: { ...config, reference: current.draft.config.reference }, candidates: [], selectedId: null }
          };
          localStorage.setItem(key, JSON.stringify(readTimbres(key).map(item => item.id === id ? next : item)));
          const job = runSongDraftJob(key, id);
          refreshTimbreScope(key);
          return job;
        },
        submitPersona(candidate, _generatedConfig, { name, style } = {}) {
          const current = writableDraft();
          const source = current?.draft.candidates.find(result => result.id === candidate?.id);
          if (current?.status !== 'confirming' || !source || current.draft.selectedId !== source.id) throw Error('请先选择并保存一个本次生成的结果');
          const { reference, ...config } = current.draft.config;
          const generationConfig = { ...config, reference: { id: reference?.id, title: reference?.title, sourceLibrary: reference?.sourceLibrary } };
          submitTimbreGeneration(context, source, String(name || ''), style, { draftRecord: current, generationConfig });
          discardAudio(reference?.blobId);
          timbreFilters.delete(key);
          render();
          showToast('已提交音色生成，可在音色库查看进度');
        }
      });
    } catch (error) {
      discardAudio(unsavedAudioId);
      throw error;
    } finally {
      openingLibraryTimbre = false;
    }
  }
  function retryTimbreGeneration(id, context = timbreContext()) {
    requireTimbreManagement(context);
    const key = timbreStorageKey(), records = readTimbres(key);
    const stored = records.find(item => item.id === id);
    const current = stored || timbreStatusExamples.find(item => item.id === id);
    if (!current || current.draft || timbreStatus(current) !== 'failed') return;
    const next = { ...current, status: 'generating', error: '', attemptId: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (!stored) {
      delete next.statusExample;
      next.id = crypto.randomUUID();
      next.createdAt = next.updatedAt;
      next.name = '微光回声';
      next.savedBy = currentAccount();
    }
    localStorage.setItem(key, JSON.stringify(stored ? records.map(item => item.id === id ? next : item) : [next, ...records]));
    runTimbreJob(key, next.id);
    render();
  }
  const exampleSongConfig = {
    reference: { title: '晨间来信 · 参考歌曲.wav', sourceLibrary: 'team' },
    lyrics: '风吹过窗前，唤醒沉睡的街。\n把日出的颜色，写进新的诗页。',
    prompt: '温暖抒情，清晰女声，钢琴伴奏',
    model: 'hawk-v6', count: 2, negativePrompt: '', styleStrength: .5, randomness: .5,
    voiceGender: 'female', instrumental: 'unspecified', skipCopyrightCheck: false
  };
  const exampleSongs = [
    { id: 'timbre-example-song-a', title: '微光回声 · 版本一', url: './assets/reference-song-result-a.wav' },
    { id: 'timbre-example-song-b', title: '微光回声 · 版本二', url: './assets/reference-song-result-b.wav' }
  ];
  const timbreExamples = [
    { id: 'timbre-demo-a', name: '温暖抒情（生成示例）', status: 'succeeded', description: '温暖柔和的抒情风格（示例）', url: exampleSongs[0].url },
    { id: 'timbre-demo-b', name: '音色示例 02', status: 'succeeded', description: '明亮轻快的流行风格（示例）', url: exampleSongs[1].url }
  ];
  const timbreExampleIds = new Set([...timbreExamples.map(item => item.id), 'timbre-generating-example-v1', 'timbre-failed-example-v1']);
  const isTimbreExample = item => item.statusExample || timbreExampleIds.has(item.id);
  // Keep status examples separate from runnable jobs so every stage stays available for review.
  const timbreStatusExamples = [
    { status: 'song-generating', style: '温暖的抒情唱腔', generationConfig: exampleSongConfig },
    { status: 'song-failed', style: '明亮的流行唱腔', generationConfig: exampleSongConfig, error: '参考音频读取失败，请重新选择音频。' },
    { status: 'confirming', style: '清晰通透的女声', generationConfig: exampleSongConfig, candidates: exampleSongs },
    { status: 'generating', style: '细腻的抒情女声', generationConfig: exampleSongConfig, source: exampleSongs[0] },
    { status: 'failed', style: '温暖细腻的流行唱法', generationConfig: exampleSongConfig, source: exampleSongs[1], error: '音色生成服务暂时不可用，请重试。' }
  ].map(example => ({
    ...example, id: 'timbre-status-example-' + example.status,
    name: timbreStateLabels[example.status] + '示例', statusExample: true,
    demo: true, folderId: null, createdAt: '2026-11-10T02:00:00Z'
  }));
  function openTimbreExample(item) {
    if (openingLibraryTimbre || document.querySelector('.timbre-creation[open]')) return;
    const context = timbreContext();
    requireTimbreAccess(context);
    const studio = window.orchestraTimbreCreation;
    if (!studio) throw Error('创建音色暂时不可用，请刷新后重试');
    const status = timbreStatus(item);
    const config = item.draft?.config || item.generationConfig || (item.id === 'timbre-demo-a' ? exampleSongConfig : {});
    const reference = config.reference === exampleSongConfig.reference
      ? { ...config.reference, url: './assets/reference-song-demo.wav' }
      : config.reference;
    const audio = status === 'succeeded'
      ? { title: item.name, url: item.url || item.source?.url }
      : item.source;
    const onRetry = status === 'failed' && !timbreManagementReason(context)
      ? () => retryTimbreGeneration(item.id, context)
      : undefined;
    document.querySelectorAll('audio').forEach(player => player.pause());
    studio.open({
      isCurrent: () => onTimbreTab() && context.team === activeTeam() && context.account === currentAccount(),
      initialDraft: {
        config: { ...config, reference },
        candidates: item.draft?.candidates || item.candidates || [],
        selectedId: item.draft?.selectedId,
        name: item.name,
        style: item.style || item.description
      },
      example: { status, error: item.error, audio, onRetry }
    });
  }
  const timbreArtwork = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 23v8m7-16v24m7-18v12m7-6v12m7-14v6"/><path d="m34 5 2.2 6.8L43 14l-6.8 2.2L34 23l-2.2-6.8L25 14l6.8-2.2L34 5Z"/></svg>';
  function timbreGenerationParameters(config = {}) {
    const reference = config.reference;
    const libraries = { personal: '个人素材库', team: '团队素材库', upload: '本地上传', workflow: '结果资源' };
    const referenceTitle = reference?.title;
    const referenceLibrary = libraries[reference?.sourceLibrary];
    const referenceLabel = referenceTitle && referenceLibrary ? `${referenceTitle}（${referenceLibrary}）` : referenceTitle;
    const booleanValue = value => typeof value === 'boolean' ? (value ? '是' : '否') : null;
    const percentageValue = value => Number.isFinite(value) ? `${Math.round(value * 100)}%` : null;
    const voiceGenderLabels = { unspecified: '不指定', female: '女声', male: '男声' };
    const field = (label, value, wide = false) => `<div class="timbre-detail-field${wide ? ' is-wide' : ''}">
      <dt>${label}</dt><dd>${escapeHtml(value ?? '未记录')}</dd>
    </div>`;
    return `<section class="timbre-detail-parameters" aria-labelledby="timbreConfigurationTitle">
      <h3 id="timbreConfigurationTitle">配置</h3>
      <dl>
        ${field('参考音频', referenceLabel, true)}
        ${field('模型版本', config.model === 'hawk-v6' ? 'Hawk（V6）' : config.model)}
        ${field('生成数量', config.count)}
        ${field('歌词', config.lyrics, true)}
        ${field('提示词', config.prompt, true)}
        ${field('反向提示词', config.negativePrompt === '' ? '未填写' : config.negativePrompt, true)}
        ${field('风格强度', percentageValue(config.styleStrength))}
        ${field('随机度', percentageValue(config.randomness))}
        ${field('人声性别', voiceGenderLabels[config.voiceGender])}
        ${field('生成纯音乐', config.instrumental === 'unspecified' ? '不指定' : booleanValue(config.instrumental))}
        ${field('跳过版权检查', booleanValue(config.skipCopyrightCheck))}
      </dl>
    </section>`;
  }
  async function openTimbrePlayback(item) {
    try { requireTimbreAccess(); } catch (error) { showToast(error.message, 'error'); return; }
    if (timbreStatus(item) !== 'succeeded') { showToast('音色生成成功后才可使用'); return; }
    document.querySelectorAll('audio').forEach(audio => audio.pause());
    const audioTitle = item.source?.title || item.sourceName || item.name;
    const dialog = openDialog(item.name, `<p class="timbre-playback-description"><b>风格描述</b> ${escapeHtml(item.style || item.description || '未记录')}</p>
      <section class="timbre-detail-source" aria-labelledby="timbrePersonaAudio">
        <h3 id="timbrePersonaAudio">生成 Persona 的音频</h3>
        <div class="timbre-detail-audio-title">${timbreArtwork}<strong>${escapeHtml(audioTitle)}</strong></div>
        <audio class="timbre-playback-audio" controls preload="metadata" aria-label="试听生成 Persona 的音频" hidden></audio>
        <p class="material-dialog-hint" data-timbre-audio-status role="status">正在加载试听音频…</p>
      </section>
      ${timbreGenerationParameters(item.generationConfig || {})}`);
    dialog.classList.add('timbre-detail-dialog');
    const audio = dialog.querySelector('audio'), status = dialog.querySelector('[data-timbre-audio-status]');
    let temporaryURL = null;
    dialog.addEventListener('close', () => { audio.pause(); audio.removeAttribute('src'); audio.load(); if (temporaryURL) URL.revokeObjectURL(temporaryURL); }, { once: true });
    audio.addEventListener('play', () => document.querySelectorAll('audio').forEach(other => { if (other !== audio) other.pause(); }));
    audio.addEventListener('error', () => { status.hidden = false; status.textContent = '音频暂时无法播放，请关闭弹窗后重试。'; });
    try {
      let url = item.source?.url || item.url;
      const blobIds = new Set([item.source?.blobId, item.blobId].filter(Boolean));
      for (const blobId of blobIds) {
        const blob = await fileOperation('get', blobId).catch(() => null);
        if (!dialog.open || !dialog.isConnected) return;
        if (!blob?.size) continue;
        temporaryURL = URL.createObjectURL(blob);
        url = temporaryURL;
        break;
      }
      if (!url) throw Error('暂无可试听音频。');
      if (!dialog.open || !dialog.isConnected) return;
      audio.src = url; audio.hidden = false; status.hidden = true;
    } catch (error) {
      if (dialog.isConnected) { status.hidden = false; status.textContent = error.message || '音频加载失败，请重试。'; }
    }
  }
  function seedTimbreExamples() {
    const key = timbreStorageKey(), records = readTimbres(key);
    const examples = timbreExamples.filter(item => !records.some(record => record.id === item.id)).map(item => ({ ...item, folderId: null, createdAt: '2026-11-05T02:00:00Z', demo: true }));
    if (examples.length) localStorage.setItem(key, JSON.stringify([...examples, ...records]));
    resumeTimbreJobs();
  }
  function timbreFolderHeight(folders, id, seen = new Set()) {
    if (seen.has(id)) throw Error('文件夹层级异常');
    const next = new Set(seen); next.add(id);
    return 1 + Math.max(0, ...folders.filter(item => item.parentId === id).map(item => timbreFolderHeight(folders, item.id, next)));
  }
  function canMoveTimbreFolder(folders, id, destination) {
    const path = timbreFolderPath(folders, destination);
    return !path.some(folder => folder.id === id) && path.length + timbreFolderHeight(folders, id) <= 2;
  }
  function moveTimbreItem(context, kind, id, destination) {
    requireTimbreManagement(context);
    if (!['folder', 'timbre'].includes(kind)) throw Error('不支持的移动类型');
    const folders = readTimbreFolders(), target = destination || null;
    if (target && !folders.some(folder => folder.id === target)) throw Error('目标位置不属于音色库，请重新选择');
    if (kind === 'folder') {
      const folder = folders.find(item => item.id === id);
      if (!folder) throw Error('文件夹已不存在');
      if (!canMoveTimbreFolder(folders, id, target)) throw Error('不能移入自身或子文件夹，且最多支持两级文件夹');
      if (folders.some(item => item.id !== id && (item.parentId || null) === target && item.name === folder.name)) throw Error('目标位置已有同名文件夹');
      localStorage.setItem(timbreFolderKey(), JSON.stringify(folders.map(item => item.id === id ? { ...item, parentId: target } : item)));
    } else {
      if (!target) throw Error('请选择音色库中的文件夹');
      const records = readTimbres();
      if (!records.some(item => item.id === id)) throw Error('音色已不存在');
      localStorage.setItem(timbreStorageKey(), JSON.stringify(records.map(item => item.id === id ? { ...item, folderId: target } : item)));
    }
  }
  function openTimbreMove(kind, id) {
    const context = timbreContext(); requireTimbreManagement(context);
    const folders = readTimbreFolders(), eligible = folders.filter(folder => kind !== 'folder' || canMoveTimbreFolder(folders, id, folder.id));
    const options = eligible.map(folder => `<option value="${escapeHtml(folder.id)}">${escapeHtml(['音色库', ...timbreFolderPath(folders, folder.id).map(item => item.name)].join(' / '))}</option>`).join('');
    const root = kind === 'folder' && canMoveTimbreFolder(folders, id, null) ? '<option value="">音色库（根目录）</option>' : '<option value="">请选择音色库中的文件夹</option>';
    if (kind === 'timbre' && !eligible.length) { showToast('请先在音色库中新建文件夹，再移动音色'); return; }
    openDialog(kind === 'folder' ? '移动音色文件夹' : '移动音色', `<label>目标位置<select name="destination">${root}${options}</select></label><p class="material-dialog-hint">仅可移动至音色库内，不能移至个人素材库或团队素材库。</p>`, '确认移动', form => {
      moveTimbreItem(context, kind, id, form.elements.destination.value); showToast('已移动');
    });
  }
  function timbreMoveButton(kind, item) {
    if (timbreManagementReason()) return '';
    return `<button type="button" class="timbre-more" data-timbre-move-kind="${kind}" data-timbre-move-id="${escapeHtml(item.id)}" title="更多操作" aria-label="${escapeHtml(item.name)}的更多操作" aria-haspopup="menu" aria-expanded="false">⋯</button>`;
  }
  function currentTimbreFilters() {
    return timbreFilters.get(timbreStorageKey()) || { name: '', statuses: [] };
  }
  function filteredTimbres(records, filters, folderId) {
    const keyword = normalizeSearch(filters.name), statuses = new Set(filters.statuses);
    const searching = Boolean(keyword || statuses.size);
    return records.filter(item => (searching || (item.folderId || null) === folderId)
      && (!keyword || normalizeSearch(item.name).includes(keyword))
      && (!statuses.size || statuses.has(timbreStatus(item))));
  }
  function updateTimbreNameFilter(event) {
    timbreFilters.set(timbreStorageKey(), { ...currentTimbreFilters(), name: event.currentTarget.value });
    if (!event.isComposing) render();
  }
  q('#timbreNameSearch').addEventListener('input', updateTimbreNameFilter);
  q('#timbreNameSearch').addEventListener('compositionend', updateTimbreNameFilter);
  q('#clearTimbreSearch').addEventListener('click', () => {
    timbreFilters.set(timbreStorageKey(), { ...currentTimbreFilters(), name: '' });
    render(); q('#timbreNameSearch').focus();
  });
  const statusPopover = q('#timbreStatusOptions');
  statusPopover.querySelector('[data-timbre-status-options]').innerHTML = Object.entries(timbreStateLabels).map(([value, label]) =>
    `<label><input type="checkbox" value="${value}">${label}</label>`).join('');
  function renderTimbreStatusFilter(statuses) {
    statusPopover.querySelectorAll('input').forEach(input => { input.checked = statuses.includes(input.value); });
    const label = statuses.length > 1 ? `已选 ${statuses.length} 项` : timbreStateLabels[statuses[0]] || '全部状态';
    q('#timbreStatusFilter [data-timbre-status-summary]').textContent = label;
    q('#timbreStatusFilter').title = statuses.map(status => timbreStateLabels[status]).join('、') || '全部状态';
    statusPopover.querySelector('[data-clear-timbre-status]').disabled = !statuses.length;
  }
  statusPopover.addEventListener('change', () => {
    const statuses = [...statusPopover.querySelectorAll('input:checked')].map(input => input.value);
    timbreFilters.set(timbreStorageKey(), { ...currentTimbreFilters(), statuses }); render();
  });
  statusPopover.querySelector('[data-clear-timbre-status]').addEventListener('click', () => {
    timbreFilters.set(timbreStorageKey(), { ...currentTimbreFilters(), statuses: [] }); render();
    statusPopover.querySelector('input')?.focus();
  });
  statusPopover.addEventListener('toggle', event => {
    const trigger = q('#timbreStatusFilter');
    trigger.setAttribute('aria-expanded', String(event.newState === 'open'));
    if (event.newState !== 'open') return;
    const rect = trigger.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, innerWidth - statusPopover.offsetWidth - 8));
    const below = rect.bottom + 6;
    const top = below + statusPopover.offsetHeight <= innerHeight - 8 ? below : Math.max(8, rect.top - statusPopover.offsetHeight - 6);
    statusPopover.style.left = `${left}px`; statusPopover.style.top = `${top}px`;
  });
  function listUsableTimbres(team = activeTeam()) {
    if (team !== activeTeam()) throw Error('团队已切换，请重新选择音色');
    requireTimbreAccess(); migrateTeamTimbres(team); seedTimbreExamples();
    return readTimbres().filter(item => timbreStatus(item) === 'succeeded').sort(newestFirst).map(item => ({ ...item }));
  }
  function validateTimbreSelection(task) {
    const id = task.formValues?.timbreId;
    if (!id) return true;
    try {
      if (!listUsableTimbres(taskTeam(task)).some(item => item.id === id)) throw Error('所选音色尚未生成成功或已不可用，请重新选择');
      return true;
    } catch (error) { showToast(error.message, 'error'); return false; }
  }
  function matchingPickerTimbres(team, name) {
    const keyword = normalizeSearch(name);
    return listUsableTimbres(team).filter(item => !keyword || normalizeSearch(item.name).includes(keyword));
  }
  function openTimbrePicker({ selectedId = '', team = activeTeam(), onSelect } = {}) {
    const context = { team, account: currentAccount() };
    requireTimbreAccess(context);
    let selected = String(selectedId || '');
    const folders = readTimbreFolders(timbreFolderKey(team));
    const dialog = openDialog('选择音色', `<p class="material-dialog-hint">从当前团队音色库中选择，仅展示生成成功的音色。</p><div class="timbre-picker-search material-search" role="search"><input type="search" class="material-search-input" data-timbre-picker-search placeholder="搜索音色名称" aria-label="搜索音色名称" aria-controls="timbrePickerList" autocomplete="off"><button type="button" class="material-search-clear" data-timbre-picker-clear aria-label="清空音色搜索" hidden>×</button></div><label class="timbre-picker-none"><input type="radio" name="pickerTimbre" value="" ${!selected ? 'checked' : ''}>不指定音色</label><p class="timbre-picker-count" data-timbre-picker-count aria-live="polite"></p><div id="timbrePickerList" class="timbre-picker-list" role="radiogroup" aria-label="可选音色"></div>`, '确认选择', async () => {
      requireTimbreAccess(context);
      const item = selected ? listUsableTimbres(team).find(item => item.id === selected) : null;
      if (selected && !item) throw Error('所选音色尚未生成成功或已不可用，请重新选择');
      await onSelect?.(item);
    });
    dialog.classList.add('timbre-picker-dialog');
    const input = dialog.querySelector('[data-timbre-picker-search]'), list = dialog.querySelector('#timbrePickerList'), clear = dialog.querySelector('[data-timbre-picker-clear]');
    const renderList = () => {
      try {
        requireTimbreAccess(context);
        const items = matchingPickerTimbres(team, input.value);
        dialog.querySelector('[data-timbre-picker-count]').textContent = `共 ${items.length} 个音色`;
        clear.hidden = !input.value;
        list.innerHTML = items.length ? items.map(item => {
          let path = '音色库';
          try { path = ['音色库', ...timbreFolderPath(folders, item.folderId).map(folder => folder.name)].join(' / '); } catch {}
          return `<label class="timbre-picker-option"><input type="radio" name="pickerTimbre" value="${escapeHtml(item.id)}" ${item.id === selected ? 'checked' : ''}><span class="timbre-picker-icon" aria-hidden="true">${timbreArtwork}</span><span class="timbre-picker-details"><strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong><span title="${escapeHtml(item.description || item.style || '暂无音色描述')}">${escapeHtml(item.description || item.style || '暂无音色描述')}</span><small title="${escapeHtml(path)}">${escapeHtml(path)}</small></span></label>`;
        }).join('') : '<p class="timbre-picker-empty" role="status">未找到匹配的可用音色，请调整名称或等待音色生成成功。</p>';
      } catch (error) {
        list.innerHTML = '<p class="timbre-picker-empty" role="status">' + escapeHtml(error.message) + '</p>';
        dialog.querySelector('[type=submit]').disabled = true;
      }
    };
    dialog.addEventListener('change', event => { if (event.target.matches('[name=pickerTimbre]')) selected = event.target.value; });
    input.addEventListener('input', event => { if (!event.isComposing) renderList(); });
    input.addEventListener('compositionend', renderList);
    clear.addEventListener('click', () => { input.value = ''; renderList(); input.focus(); });
    renderList(); input.focus();
    return dialog;
  }
  function timbreSelectionMarkup(task, locked) {
    const options = listUsableTimbres(taskTeam(task)), id = String(task.formValues?.timbreId || '');
    const chosen = options.find(item => item.id === id), name = chosen?.name || (id ? '原音色未生成成功或不可用' : '选择音色');
    return `<div class="song-studio-setting"><span>音色</span><input type="hidden" data-task-field="timbreId" value="${escapeHtml(id)}"><button type="button" class="timbre-choose-button" data-task-pick-timbre aria-haspopup="dialog" aria-label="选择音色：${escapeHtml(name)}" title="${escapeHtml(name)}" ${locked ? 'disabled' : ''}><span>${escapeHtml(name)}</span><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m6 4 4 4-4 4"/></svg></button></div>`;
  }
  taskDetailPanel.addEventListener('click', event => {
    const button = event.target.closest('[data-task-pick-timbre]');
    if (!button || button.disabled) return;
    const task = productionTasks.find(item => item.id === selectedTaskId);
    if (!task || task.status !== 'in_progress') return;
    try {
      saveTaskPageValues(task);
      openTimbrePicker({ selectedId: task.formValues?.timbreId || '', team: taskTeam(task), onSelect: item => {
        if (task.status !== 'in_progress' || !productionTasks.includes(task)) throw Error('任务已更新，请重新打开任务');
        const previous = { ...(task.formValues || {}) }, updatedAt = task.updatedAt;
        task.formValues = { ...previous, timbreId: item?.id || '', timbreName: item?.name || '' }; task.updatedAt = Date.now();
        if (!persistProductionTasks()) { task.formValues = previous; task.updatedAt = updatedAt; throw Error('音色选择保存失败，请重试'); }
        if (selectedTaskId === task.id) renderTaskCenter();
      } });
    } catch (error) { showToast(error.message || '音色选择暂时不可用，请重试', 'error'); }
  });
  const timbreStatusHints = {
    'song-generating': '歌曲正在生成，完成后可以试听并选择一首作为音色来源。',
    'song-failed': '请检查参考音频与歌曲配置，再重新生成歌曲。',
    confirming: '歌曲已生成，请试听并选择一首作为音色来源。',
    generating: '正在使用选中的歌曲生成音色，完成后可在工作流中选用。',
    failed: '可使用原先选中的歌曲重新生成音色。'
  };
  function openTimbreStatusDetails(item) {
    const context = timbreContext();
    requireTimbreAccess(context);
    const state = timbreStatus(item);
    const canRetry = state === 'failed' && !timbreManagementReason();
    const track = item.source;
    const results = track ? `<section class="timbre-detail-source"><h3>选中的歌曲</h3>
      <div class="timbre-status-track">
        <strong>${escapeHtml(track.title)}</strong>
        ${track.url ? `<audio class="timbre-playback-audio" controls preload="metadata" src="${escapeHtml(track.url)}" aria-label="试听 ${escapeHtml(track.title)}"></audio>` : ''}
      </div>
    </section>` : '';
    document.querySelectorAll('audio').forEach(audio => audio.pause());
    const dialog = openDialog(item.name, `
      <div class="timbre-status-summary"><strong>${timbreStateLabels[state]}</strong></div>
      <p class="material-dialog-hint">${timbreStatusHints[state]}</p>
      ${state === 'song-generating' ? '<button type="button" class="material-primary" disabled>重新生成歌曲</button>' : ''}
      ${item.error ? `<p class="timbre-status-error"><b>失败原因</b> ${escapeHtml(item.error)}</p>` : ''}
      <p class="timbre-playback-description"><b>风格描述</b> ${escapeHtml(item.style || item.description || '未填写')}</p>
      ${results}
      ${timbreGenerationParameters(item.draft?.config || item.generationConfig || {})}
    `, canRetry ? '重新生成音色' : null, () => retryTimbreGeneration(item.id, context));
    dialog.classList.add('timbre-detail-dialog');
    dialog.addEventListener('play', event => {
      dialog.querySelectorAll('audio').forEach(audio => { if (audio !== event.target) audio.pause(); });
    }, true);
  }
  function renderTimbres() {
    const createButton = q('[data-create-library-timbre]');
    createButton.hidden = true;
    requireTimbreAccess(); migrateTeamTimbres(); seedTimbreExamples();
    const filters = currentTimbreFilters();
    const searching = Boolean(normalizeSearch(filters.name) || filters.statuses.length), managementReason = timbreManagementReason(), canManage = !managementReason;
    createButton.hidden = !canManage;
    const input = q('#timbreNameSearch'); if (input.value !== filters.name) input.value = filters.name;
    renderTimbreStatusFilter(filters.statuses); q('#clearTimbreSearch').hidden = !filters.name;
    const folders = readTimbreFolders(), key = timbreFolderKey();
    let folderId = timbreFolderLocations.get(key) || null;
    if (folderId && !folders.some(folder => folder.id === folderId)) { folderId = null; timbreFolderLocations.delete(key); }
    const path = timbreFolderPath(folders, folderId), canCreate = canManage && path.length < 2;
    const children = searching ? [] : folders.filter(folder => (folder.parentId || null) === folderId).sort(newestFirst);
    const items = filteredTimbres([...readTimbres(), ...timbreStatusExamples].sort(newestFirst), filters, folderId);
    q('#timbreBreadcrumb').hidden = !path.length;
    q('#timbreBreadcrumb').innerHTML = [{ id: '', name: '音色库' }, ...path].map((folder, index) => `${index ? '<span aria-hidden="true">/</span>' : ''}${index === path.length ? `<span aria-current="page">${escapeHtml(folder.name)}</span>` : `<button type="button" data-open-timbre-folder="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</button>`}`).join('');
    q('#timbreLibraryCount').textContent = `共 ${children.length} 个文件夹，${items.length} 个音色`;
    const folderCards = (searching ? '' : `<div class="material-add-card" role="listitem"><button type="button" class="material-new-folder timbre-new-folder" data-create-timbre-folder ${canCreate ? '' : 'disabled'} aria-label="新建文件夹" title="${canCreate ? '新建文件夹' : escapeHtml(managementReason || '最多支持两级文件夹，根目录不计入层级')}"><span class="material-folder-cover" aria-hidden="true">${folderArtwork}<span>＋</span></span><strong>新建文件夹</strong></button></div>`) + children.map(folder => `<div class="material-folder-item" role="listitem"><button type="button" class="material-folder-card" data-open-timbre-folder="${escapeHtml(folder.id)}" aria-label="打开文件夹：${escapeHtml(folder.name)}"><span class="material-folder-cover" aria-hidden="true">${folderArtwork}</span><span class="material-folder-info"><strong title="${escapeHtml(folder.name)}">${escapeHtml(folder.name)}</strong><time>${materialDate(folder.createdAt)}</time></span></button>${timbreMoveButton('folder', folder)}</div>`).join('');
    const grid = q('#timbreLibraryGrid');
    grid.innerHTML = folderCards + items.map(item => {
      const state = timbreStatus(item), ready = state === 'succeeded';
      const example = isTimbreExample(item);
      const viewable = ready || canManage || example;
      const resume = canManage && item.draft && state !== 'song-generating';
      const label = timbreStateLabels[state];
      const action = example ? '打开创建音色示例' : ready ? '打开试听弹窗' : resume ? '继续创建音色' : '查看' + label + '详情';
      return `<div class="timbre-card" data-timbre-state="${state}" role="listitem"><div class="timbre-card-visual"><button type="button" class="timbre-preview-button" ${viewable ? 'aria-haspopup="dialog"' : 'disabled'} aria-label="${escapeHtml(item.name)}，${action}" title="${action}"><span class="timbre-cover">${timbreArtwork}</span></button>${label && !ready ? `<span class="timbre-generation-status is-${state}" role="status">${label}</span>` : ''}${state === 'failed' && canManage && !item.draft ? `<button type="button" class="timbre-retry" data-retry-timbre="${escapeHtml(item.id)}" title="重新生成音色" aria-label="重新生成音色：${escapeHtml(item.name)}"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6.2 6.2 0 1 0 .1 4M16 3v5h-5"/></svg></button>` : ''}</div><div class="timbre-card-info"><strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong><p title="${escapeHtml(item.description || item.style || '暂无音色描述')}">${escapeHtml(item.description || item.style || '暂无音色描述')}</p></div>${item.statusExample ? '' : timbreMoveButton('timbre', item)}</div>`;
    }).join('') + (searching && !items.length ? '<p class="timbre-no-results" role="status">未找到匹配的音色，请调整名称或状态条件。</p>' : '');
    grid.querySelectorAll('[data-timbre-move-id]').forEach(button => button.addEventListener('click', () => {
      openMenu(button, [{ label: '移动到', action: () => openTimbreMove(button.dataset.timbreMoveKind, button.dataset.timbreMoveId) }]);
    }));
    grid.querySelectorAll('.timbre-preview-button').forEach((button, index) => {
      button.addEventListener('click', async () => {
        if (button.disabled) return;
        const item = items[index];
        try {
          const state = timbreStatus(item);
          if (canManage && item.statusExample && ['song-failed', 'confirming'].includes(state)) {
            await openLibraryTimbreCreation(null, item);
          } else if (isTimbreExample(item)) openTimbreExample(item);
          else if (state === 'succeeded') await openTimbrePlayback(item);
          else if (item.draft && state !== 'song-generating') await openLibraryTimbreCreation(item.id);
          else openTimbreStatusDetails(item);
        } catch (error) { showToast(error.message, 'error'); }
      });
    });
    grid.querySelectorAll('[data-retry-timbre]').forEach(button => button.addEventListener('click', () => {
      try { retryTimbreGeneration(button.dataset.retryTimbre); } catch (error) { showToast(error.message || '重新生成失败，请重试', 'error'); }
    }));
  }

  function render() {
    clearMaterialDrag(); closeMenu(); releasePreviews();
    try { resumeTimbreJobs(); } catch {}
    const version = ++renderVersion;
    const timbreSelected = selectedLibrary === 'timbre';
    q('#materialLibraryContent').hidden = timbreSelected;
    q('#timbreLibraryContent').hidden = !timbreSelected;
    if (onTimbreTab()) {
      try { renderTimbres(); }
      catch (error) {
        q('#timbreLibraryGrid').innerHTML = '<p class="timbre-no-results" role="status">' + escapeHtml(error.message) + '</p>';
        q('#timbreLibraryCount').textContent = '';
      }
      return;
    }
    if (statusPopover.matches(':popover-open')) statusPopover.hidePopover();
    if (timbreSelected) return;
    try {
      const context = contextNow(); seedTeamExamples(context); organizeLooseMaterials(context);
      const folders = foldersFor(context);
      let path;
      try { path = folderPath(context, folders); }
      catch { context.folderId = null; locations.delete(locationKey(context)); path = []; }
      const keyword = searchTerm(context), searching = Boolean(keyword), searchInput = q('#materialSearch');
      const value = searches.get(locationKey(context)) || '';
      if (searchInput.value !== value) searchInput.value = value;
      searchInput.setAttribute('aria-label', `搜索${libraryName(context.library)}名称（含子文件夹）`);
      q('#clearMaterialSearch').hidden = !value;
      const children = folders.filter(folder => searching ? normalizeSearch(folder.title).includes(keyword) : folder.parentId === context.folderId);
      const records = visibleRecords(context).filter(record => searching ? normalizeSearch(record.title).includes(keyword) : recordFolder(record, context, folders) === context.folderId);
      const breadcrumb = q('#materialBreadcrumb'); breadcrumb.hidden = !path.length;
      breadcrumb.innerHTML = [{ id: '', title: libraryName(context.library) }, ...path].map((folder, index) => `${index ? '<span aria-hidden="true">/</span>' : ''}${index === path.length ? `<span aria-current="page">${escapeHtml(folder.title)}</span>` : `<button type="button" data-open-material-folder="${escapeHtml(folder.id)}">${escapeHtml(folder.title)}</button>`}`).join('');
      q('#materialCount').textContent = `${searching ? '找到' : '共'} ${children.length} 个文件夹，${records.length} 个文件`;
      const canCreateFolder = path.length < 2;
      const createCard = `<div class="material-add-card" role="listitem"><button type="button" class="material-new-folder" data-create-material-folder ${canCreateFolder ? '' : 'disabled'} title="${canCreateFolder ? '新建文件夹' : '最多支持 2 层文件夹'}" aria-label="新建文件夹"><span class="material-folder-cover" aria-hidden="true">${folderArtwork}<span>＋</span></span></button><button type="button" class="material-add-button" data-add-material><span aria-hidden="true">＋</span>添加素材</button></div>`;
      const entries = [...children.map(item => ({ ...item, kind: 'folder' })), ...records.map(item => ({ ...item, kind: 'material' }))].sort(newestFirst);
      q('#materialItems').innerHTML = createCard + entries.map(item => {
        const title = escapeHtml(item.title), date = materialDate(item.createdAt), id = escapeHtml(item.id);
        if (item.kind === 'folder') return `<div role="listitem" class="material-folder-item" data-drop-material-folder="${id}"><button class="material-folder-card" type="button" data-open-material-folder="${id}" aria-label="打开文件夹：${title}"><span class="material-folder-cover" aria-hidden="true">${folderArtwork}</span><span class="material-folder-info"><strong title="${title}">${title}</strong><time datetime="${escapeHtml(item.createdAt)}">${escapeHtml(date)}</time></span></button>${menuTrigger('folder', item)}</div>`;
        const type = ['text', 'image'].includes(item.type) ? item.type : 'audio', folderId = recordFolder(item, context, folders);
        const resultPath = searching ? [libraryName(context.library), ...folderPath({ ...context, folderId }, folders).map(folder => folder.title)].join(' / ') : '';
        return `<article class="material-file-card" role="listitem" draggable="${!searching}" ${searching ? '' : `data-drag-material="${id}"`}><div class="material-file-preview material-file-preview-${type}">${previewMarkup(item)}</div><div class="material-file-info"><h3 title="${title}">${title}</h3>${menuTrigger('material', item)}<time datetime="${escapeHtml(item.createdAt)}">${escapeHtml(date)}</time>${searching ? `<button type="button" class="material-result-path" data-open-material-folder="${escapeHtml(folderId || '')}" title="打开所在位置：${escapeHtml(resultPath)}">${escapeHtml(resultPath)}</button>` : ''}</div></article>`;
      }).join('') + (searching && !entries.length ? '<p class="material-grid-message">未找到匹配素材，请更换关键词。</p>' : '');
      hydratePreviews(version);
    } catch {
      q('#materialCount').textContent = '素材读取失败';
      q('#materialItems').innerHTML = '<p class="material-grid-message" role="status">无法读取素材，原有记录仍保留，请刷新后重试。</p>';
    }
  }
  function openFolder(id) {
    const context = { ...contextNow(), folderId: id || null };
    try { folderPath(context); locations.set(locationKey(context), context.folderId); searches.delete(locationKey(context)); render(); }
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
    openDialog('新建文件夹', `<p class="material-dialog-hint">位置：${escapeHtml(destinationLabel(target))}</p><label>文件夹名称 <span>*</span><input name="title" required maxlength="40" data-name-limit="20" placeholder="请输入文件夹名称" autocomplete="off" autofocus></label><p class="material-dialog-hint">名称不超过 20 个字符，支持特殊符号。创建后将「${escapeHtml(item.title)}」移入新文件夹。</p>`, '创建并移入', form => {
      getItem(context, kind, id);
      const restriction = moveNewFolderRestriction(context, kind, id, parentId);
      if (restriction) throw new Error(restriction);
      const previousFolders = readFolders(context.team), folder = createFolder(target, form.elements.title.value);
      try { performMove(context, kind, id, folder.id); }
      catch (error) { persist(folderStorageKey(context.team), previousFolders); throw error; }
      showToast('已创建文件夹并移入');
    });
  }
  function openMoveLibraryMenu(trigger, context, kind, id, focus = false) {
    if (!activeMenu) return;
    if (activeMenu.submenus[0]?.trigger === trigger) { if (focus) activeMenu.submenus[0].menu.querySelector('button').focus(); return; }
    closeMoveMenus();
    const menu = document.createElement('div'); menu.className = 'material-dropdown material-library-submenu'; menu.id = 'materialMoveLibraries'; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', '选择目标素材库');
    menu.innerHTML = `<button type="button" role="menuitem" aria-haspopup="menu" aria-expanded="false">${libraryName(context.library)}<span aria-hidden="true">›</span></button>`;
    document.body.append(menu); activeMenu.submenus.push({ menu, trigger });
    trigger.setAttribute('aria-expanded', 'true'); trigger.setAttribute('aria-controls', menu.id);
    const rect = trigger.getBoundingClientRect(), owner = activeMenu.menu.getBoundingClientRect(), bounds = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(owner.right + bounds.width <= window.innerWidth - 8 ? owner.right : owner.left - bounds.width, window.innerWidth - bounds.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(rect.top, window.innerHeight - bounds.height - 8)) + 'px';
    const button = menu.querySelector('button');
    const expand = focusChild => openMoveMenu(button, context, kind, id, null, 1, focusChild);
    button.addEventListener('pointerenter', () => expand(false)); button.addEventListener('click', () => expand(true));
    menu.addEventListener('keydown', event => {
      if (['ArrowLeft', 'Escape'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); closeMoveMenus(); trigger.focus(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); expand(true); }
      if (event.key === 'Tab') closeMenu(true);
    });
    if (focus) button.focus();
  }
  function openMoveMenu(trigger, context, kind, id, parentId = null, level = 0, focus = false) {
    if (!activeMenu) return;
    if (activeMenu.submenus[level]?.trigger === trigger) {
      if (focus) activeMenu.submenus[level].menu.querySelector('button:not(:disabled)')?.focus();
      return;
    }
    const entries = moveMenuEntries(context, kind, id, parentId).filter(entry => kind !== 'folder' || !descendantIds(context, id).has(entry.id));
    const parent = parentId ? getItem(context, 'folder', parentId) : null;
    const reason = moveRestriction(context, kind, id, parentId), createReason = moveNewFolderRestriction(context, kind, id, parentId);
    closeMoveMenus(level);
    const ownerMenu = level ? activeMenu.submenus[level - 1].menu : activeMenu.menu;
    const menu = document.createElement('div');
    menu.className = 'material-dropdown material-move-submenu'; menu.id = `materialMoveMenu${level}`;
    menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', `移动到${parent?.title || libraryName(context.library)}`);
    const currentDestination = parentId || !reason
      ? `<button type="button" role="menuitem" tabindex="-1" class="material-move-current" data-move-current ${reason ? `disabled title="${escapeHtml(reason)}"` : ''}><span>${parentId ? '移到此文件夹' : '移到素材库根目录'}</span>${reason ? `<small>${escapeHtml(reason)}</small>` : ''}</button>` : '';
    menu.innerHTML = `<button class="material-move-menu-heading" type="button" role="menuitem" tabindex="-1" data-move-create title="${escapeHtml(createReason || '新建文件夹并移入')}" ${createReason ? 'disabled' : ''}><span>新建文件夹</span><span aria-hidden="true">＋</span></button>${currentDestination}${entries.map((entry, index) => `<button type="button" role="menuitem" tabindex="-1" class="material-move-destination" data-move-index="${index}" ${entry.disabled ? 'disabled' : ''} title="${escapeHtml(entry.reason || entry.title)}" ${entry.hasChildren ? 'aria-haspopup="menu" aria-expanded="false"' : ''}><span class="material-move-menu-icon">${folderIcon}</span><span class="material-move-menu-name">${escapeHtml(entry.title)}</span>${entry.hasChildren ? '<span class="material-move-menu-arrow" aria-hidden="true">›</span>' : ''}${entry.reason ? `<small>${escapeHtml(entry.reason)}</small>` : ''}</button>`).join('')}${entries.length ? '' : '<p class="material-move-menu-empty">暂无文件夹</p>'}`;
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
    menu.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - bounds.width - 8)) + 'px';
    menu.style.top = Math.max(8, rect.bottom + bounds.height + 6 <= window.innerHeight ? rect.bottom + 6 : rect.top - bounds.height - 6) + 'px';
    const enabled = Array.from(menu.querySelectorAll('button:not(:disabled)'));
    enabled[0]?.focus();
    const expand = (button, focus) => {
      const submenu = items[Number(button.dataset.menuIndex)]?.submenu;
      if (submenu) openMoveLibraryMenu(button, submenu.context, submenu.kind, submenu.id, focus);
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
  function openCardMenu(trigger) {
    const context = contextNow(), kind = trigger.dataset.materialMenu, id = trigger.dataset.materialId;
    getItem(context, kind, id);
    openMenu(trigger, [
      { label: '移动到', submenu: { context, kind, id } },
      ...(kind === 'material' && context.library === 'personal' ? [{ label: '转移至团队素材库', reason: teamTransferReason(context, id), action: () => openTransferToTeam(context, id) }] : []),
      ...(kind === 'material' ? [{ label: '下载', action: () => download(getItem(context, kind, id)) }] : []),
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
    // Native maxlength counts UTF-16 units; validate code points so emoji also count as one character.
    const nameInputs = Array.from(dialog.querySelectorAll('input[name="title"], input[name="newFolderName"]'));
    const validateNames = () => nameInputs.forEach(input => {
      const limit = Number(input.dataset.nameLimit) || 50;
      input.setCustomValidity(Array.from(input.value).length > limit ? `名称不能超过 ${limit} 个字符` : '');
    });
    nameInputs.forEach(input => input.addEventListener('input', validateNames));
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => { if (!busy) dialog.close(); }));
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (busy || !onSubmit) return;
      error.textContent = ''; validateNames(); if (!form.reportValidity()) return;
      busy = true; dialog.setAttribute('aria-busy', 'true');
      dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });
      try { await onSubmit(form); dialog.close(); render(); }
      catch (failure) { error.textContent = failure.message || '操作失败，请重试'; }
      finally { busy = false; dialog.removeAttribute('aria-busy'); dialog.querySelectorAll('button').forEach(button => { button.disabled = false; }); dialog.dispatchEvent(new Event('material-submit-finished')); }
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
      openDialog('新建文件夹', `<p class="material-dialog-hint">位置：${escapeHtml(destinationLabel(context))}</p><label>文件夹名称 <span>*</span><input name="title" required maxlength="40" data-name-limit="20" placeholder="请输入文件夹名称" autocomplete="off" autofocus></label><p class="material-dialog-hint">名称不超过 20 个字符，支持特殊符号；同一目录下名称不能重复。</p>`, '创建', form => { createFolder(context, form.elements.title.value); showToast('文件夹已创建'); });
    } catch (error) { showToast(error.message, 'error'); }
  }
  function openAddMaterial() {
    const context = contextNow(); requireMaterialLocation(context);
    let mode = 'media', selected = [];
    const dialog = openDialog('添加素材', `
      <div class="material-add-tabs" role="tablist" aria-label="素材类型">
        <button id="materialMediaTab" type="button" role="tab" data-add-tab="media" aria-selected="true" aria-controls="materialMediaPanel">图片/音频</button>
        <button id="materialTextTab" type="button" role="tab" data-add-tab="text" aria-selected="false" aria-controls="materialTextPanel" tabindex="-1">文本</button>
      </div>
      <section id="materialMediaPanel" role="tabpanel" aria-labelledby="materialMediaTab">
        <label class="material-upload-label">选择文件 <span>*</span></label>
        <input type="file" name="files" class="material-hidden-file" multiple accept=".png,.jpg,.jpeg,.gif,.webp,.avif,.mp3,.wav,.m4a,.ogg,.flac,.aac" aria-label="选择图片或音频文件" tabindex="-1">
        <div class="material-upload-zone" aria-label="已选文件，可拖入图片或音频">
          <div class="material-upload-list"></div>
          <button type="button" class="material-upload-plus" data-pick-files aria-label="选择文件">＋</button>
        </div>
        <p class="material-upload-formats">▧ 支持图片类型：PNG/JPG/GIF/WebP/AVIF　 ♫ 支持音频类型：MP3/WAV/M4A/OGG/FLAC/AAC<br>单个文件不超过 50 MB，一次最多添加 10 个文件</p>
      </section>
      <section id="materialTextPanel" role="tabpanel" aria-labelledby="materialTextTab" hidden>
        <label>名称 <span>*</span><input name="title" maxlength="100" data-name-limit="50" placeholder="例如：歌曲灵感、参考歌词" autocomplete="off" aria-label="素材名称，不超过 50 个字符" disabled></label>
        <label>文本内容 <span>*</span><div class="material-text-editor"><textarea name="content" maxlength="40000" placeholder="请输入文本内容" disabled></textarea><span data-text-count aria-live="polite">0/20000</span></div></label>
      </section>`, '确认添加', async form => {
      if (context.account !== currentAccount() || context.team !== activeTeam()) throw new Error('账号或团队已变更，请重新打开添加素材');
      if (mode === 'text') {
        const content = form.elements.content.value;
        if (!content.trim()) throw new Error('请输入文本内容');
        if (Array.from(content).length > 20000) throw new Error('文本内容不能超过 20000 个字符');
        addMaterial(context, { title: form.elements.title.value, type: 'text', content });
        showToast('文本素材已添加');
      } else {
        await uploadFiles(context, selected.map(entry => ({ file: entry.file, title: entry.title })));
        showToast(`已添加 ${selected.length} 个素材`);
      }
    });
    dialog.classList.add('material-add-dialog');
    const form = dialog.querySelector('form'), title = form.elements.title, content = form.elements.content, files = form.elements.files;
    const error = dialog.querySelector('.material-dialog-error'), submit = dialog.querySelector('[type="submit"]');
    const zone = dialog.querySelector('.material-upload-zone'), list = dialog.querySelector('.material-upload-list'), picker = dialog.querySelector('[data-pick-files]');
    const busy = () => dialog.hasAttribute('aria-busy');
    const update = () => {
      const length = Array.from(content.value).length;
      dialog.querySelector('[data-text-count]').textContent = `${length}/20000`;
      content.setCustomValidity(length > 20000 ? '文本内容不能超过 20000 个字符' : '');
      title.setCustomValidity(Array.from(title.value).length > 50 ? '名称不能超过 50 个字符' : '');
      submit.disabled = busy() || (mode === 'text' ? !title.value.trim() || !content.value.trim() || Array.from(title.value).length > 50 || length > 20000 : !selected.length || selected.some(entry => !entry.title.trim() || Array.from(entry.title).length > 50));
      picker.disabled = busy() || selected.length >= 10;
      picker.title = selected.length >= 10 ? '一次最多添加 10 个文件' : '选择文件';
    };
    const renderSelection = () => {
      list.innerHTML = selected.map((entry, index) => `<div class="material-upload-item"><div class="material-upload-thumb">${entry.type === 'image' ? `<img src="${escapeHtml(entry.url)}" alt="${escapeHtml(entry.file.name)}">` : audioSymbol()}<button type="button" data-remove-upload="${index}" aria-label="移除 ${escapeHtml(entry.file.name)}">×</button></div><input data-upload-name="${index}" value="${escapeHtml(entry.title)}" maxlength="100" aria-label="素材名称，不超过 50 个字符" title="${escapeHtml(entry.file.name)}"></div>`).join('');
      update();
    };
    const addFiles = incoming => {
      if (busy()) return;
      try {
        const unique = Array.from(incoming).filter((file, index, all) => !selected.some(entry => entry.file.name === file.name && entry.file.size === file.size && entry.file.lastModified === file.lastModified) && all.findIndex(other => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified) === index);
        if (selected.length + unique.length > 10) throw new Error('一次最多添加 10 个文件，请减少后重试');
        const checked = unique.map(file => ({ file, type: validateUpload(file), title: Array.from(file.name).slice(0, 50).join('') }));
        selected.push(...checked.map(entry => ({ ...entry, url: entry.type === 'image' ? URL.createObjectURL(entry.file) : '' })));
        error.textContent = ''; renderSelection();
      } catch (failure) { error.textContent = failure.message; }
      files.value = '';
    };
    const selectTab = tab => {
      if (busy()) return;
      mode = tab.dataset.addTab;
      dialog.querySelectorAll('[data-add-tab]').forEach(button => { const active = button === tab; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
      dialog.querySelector('#materialMediaPanel').hidden = mode !== 'media';
      dialog.querySelector('#materialTextPanel').hidden = mode !== 'text';
      list.querySelectorAll('[data-upload-name]').forEach(input => input.disabled = mode !== 'media');
      title.disabled = content.disabled = mode !== 'text'; title.required = content.required = mode === 'text'; files.disabled = mode !== 'media';
      error.textContent = ''; update();
    };
    const tabs = Array.from(dialog.querySelectorAll('[data-add-tab]'));
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = tabs[event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index]; selectTab(next); next.focus(); } });
    });
    picker.addEventListener('click', () => files.click());
    files.addEventListener('change', () => addFiles(files.files));
    zone.addEventListener('dragover', event => { event.preventDefault(); if (!busy()) zone.classList.add('is-drag-over'); });
    zone.addEventListener('dragleave', event => { if (!zone.contains(event.relatedTarget)) zone.classList.remove('is-drag-over'); });
    zone.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('is-drag-over'); addFiles(event.dataTransfer.files); });
    list.addEventListener('click', event => { const button = event.target.closest('[data-remove-upload]'); if (!button || busy()) return; const [removed] = selected.splice(Number(button.dataset.removeUpload), 1); if (removed.url) URL.revokeObjectURL(removed.url); renderSelection(); });
    list.addEventListener('input', event => { const input = event.target.closest('[data-upload-name]'); if (!input || busy()) return; selected[Number(input.dataset.uploadName)].title = input.value; input.setCustomValidity(Array.from(input.value).length > 50 ? '名称不能超过 50 个字符' : ''); update(); });
    title.addEventListener('input', update); content.addEventListener('input', update);
    dialog.addEventListener('material-submit-finished', update);
    dialog.addEventListener('close', () => selected.forEach(entry => { if (entry.url) URL.revokeObjectURL(entry.url); }), { once: true });
    update();
  }
  function openRename(context, kind, id) {
    const item = getItem(context, kind, id);
    const limit = kind === 'folder' ? 20 : 50;
    const dialog = openDialog('重命名', `<label>${kind === 'folder' ? '文件夹名称' : '素材名称'} <span>*</span><input name="title" required maxlength="${limit * 2}" data-name-limit="${limit}" autocomplete="off" autofocus></label><p class="material-dialog-hint">名称不超过 ${limit} 个字符，支持特殊符号。</p>`, '保存', form => {
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
      const context = contextNow(), original = getItem(context, 'material', record.id);
      const dialog = openDialog('编辑文本', `
        <label>标题 <span>*</span><input name="title" required maxlength="100" autocomplete="off" autofocus placeholder="请输入文本标题"></label>
        <p class="material-dialog-hint">标题不超过 50 个字符，支持特殊符号。</p>
        <label>内容 <span>*</span><textarea name="content" required maxlength="40000" placeholder="请输入文本内容"></textarea></label>
        <p class="material-dialog-hint">最多 20,000 个字符，点击保存后生效。</p>`, '保存', form => {
        if (context.account !== currentAccount() || context.team !== activeTeam()) throw new Error('当前账号或团队已变更，请关闭弹窗后重试');
        const current = getItem(context, 'material', record.id);
        if (current.type !== 'text') throw new Error('该素材已不是文本，请重新打开');
        if (current.title !== original.title || current.content !== original.content) throw new Error('文本已更新，请关闭后重新打开再编辑');
        const title = titleValue(form.elements.title.value), content = form.elements.content.value;
        if (!content.trim()) throw new Error('请输入文本内容');
        if (Array.from(content).length > 20000) throw new Error('文本内容不能超过 20,000 个字符');
        const scope = scopeKey(context);
        persist(storageKey(context.team), read(context.team).map(item => item.id === record.id ? {
          ...item,
          namesByLibrary: { ...item.namesByLibrary, [scope]: title },
          contentsByLibrary: { ...item.contentsByLibrary, [scope]: content },
          updatedAt: new Date().toISOString()
        } : item));
        showToast('文本已保存');
      });
      const form = dialog.querySelector('form');
      form.elements.title.value = original.title;
      form.elements.content.value = original.content || '';
      return;
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
    if (['./assets/reference-song-result-a.wav', './assets/reference-song-result-b.wav', './assets/demo-tone.wav'].includes(record.url)) {
      if (!window.orchestraMaterialDemoAudio) await loadLocalScript('./assets/material-demo-audio.js');
      const binary = atob(window.orchestraMaterialDemoAudio[record.url]);
      return new Blob([Uint8Array.from(binary, char => char.charCodeAt(0))], { type: 'audio/wav' });
    }
    const response = await fetch(record.url);
    if (!response.ok) throw new Error(`「${record.title}」读取失败，未生成下载包`);
    return response.blob();
  }
  function selectLibrary(tab) {
    selectedLibrary = tab.dataset.materialLibrary;
    libraryTabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    if (selectedLibrary !== 'timbre') q('#materialLibraryContent').setAttribute('aria-labelledby', tab.id);
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
  q('#materialSearch')?.addEventListener('input', updateMaterialSearch);
  q('#materialSearch')?.addEventListener('compositionend', updateMaterialSearch);
  q('#materialSearch')?.addEventListener('search', updateMaterialSearch);
  q('#materialSearch')?.addEventListener('keydown', event => { if (event.key === 'Escape' && !event.isComposing) { event.preventDefault(); clearMaterialSearch(); } });
  q('#clearMaterialSearch')?.addEventListener('click', clearMaterialSearch);
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
    if (event.target.closest('[data-add-material]')) { try { openAddMaterial(); } catch (error) { showToast(error.message, 'error'); } return; }
    if (event.target.closest('[data-create-material-folder]')) { openCreateFolder(); return; }
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
  new MutationObserver(render).observe(assetsPage, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => { if (panel.hidden) { clearMaterialDrag(); stopAudio(); closeMenu(); } }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('click', event => { if (event.target.closest('.workspace-option')) queueMicrotask(render); });
  window.addEventListener('pagehide', releasePreviews);
  window.addEventListener('pagehide', clearMaterialDrag);
  window.addEventListener('blur', clearMaterialDrag);
  document.addEventListener('dragend', clearMaterialDrag);
  document.addEventListener('dragover', event => { if (materialDrag && !panel.contains(event.target)) setMaterialDropTarget(null); });
  document.addEventListener('drop', clearMaterialDrag);
  window.addEventListener('storage', event => { if ([storageKey(activeTeam()), folderStorageKey(activeTeam()), timbreStorageKey(), timbreFolderKey(), 'orchestra-account-organizations:' + currentAccount(), 'orchestra-login-organizations', 'orchestra-demo-account'].includes(event.key)) render(); });
  document.addEventListener('pointerdown', event => { if (activeMenu && !insideActiveMenu(event.target)) closeMenu(); });
  window.addEventListener('resize', () => closeMenu());
  document.addEventListener('scroll', event => { if (activeMenu && !insideActiveMenu(event.target)) closeMenu(); }, true);
  window.orchestraMaterialLibrary = { hasSaved, save, folderArtwork, listUsableTimbres, validateTimbreSelection, timbreSelectionMarkup, openTimbrePicker };
  Object.assign(window.orchestraMaterialLibrary, {
    listForComposition(team = activeTeam()) {
      if (team !== activeTeam()) throw new Error('当前团队已变更，请重新打开成品');
      const account = currentAccount();
      return ['personal', 'team'].flatMap(library => {
        const context = { team, account, library }, folders = foldersFor(context);
        return visibleRecords(context).map(record => ({ ...record, type: record.type || 'audio', sourceLibrary: library,
          folderPath: [saveLibraryName(library), ...folderPath({ ...context, folderId: recordFolder(record, context, folders) }, folders).map(folder => folder.title)].join(' / ')
        }));
      });
    },
    readBlob: materialBlob,
    async ensureZip() {
      if (!window.JSZip) await loadLocalScript('./vendor/jszip.min.js');
      return window.JSZip;
    }
  });
  render();
})();
