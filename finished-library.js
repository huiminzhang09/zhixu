/* Finished works use resource snapshots; edits are committed only on Save. */
function renderFinishedLibrary(){ window.orchestraFinishedLibrary?.render(); }
(()=>{
  const grid=document.querySelector('#finishedWorkGrid'),page=document.querySelector('#finishedPage');
  const dialogs=new Set(),downloading=new Set();
  const searchInput=document.querySelector('#finishedWorkSearch'),clearSearchButton=document.querySelector('#clearFinishedWorkSearch'),searches=new Map();
  const listPanel=document.querySelector('#finishedLibraryPanel'),editorPanel=document.querySelector('#finishedEditorPanel');
  let activeMenu=null,activeEditor=null;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const team=()=>document.querySelector('.workspace-option.active')?.dataset.workspaceId||'orchestra-studio';
  const account=()=>localStorage.getItem('orchestra-demo-account')||'demo-user';
  const searchScope=()=>JSON.stringify([team(),account()]);
  const normalizeSearch=value=>String(value||'').normalize('NFKC').trim().toLocaleLowerCase();
  const newestFirst=(a,b)=>(Date.parse(b.work.createdAt)||0)-(Date.parse(a.work.createdAt)||0);
  function updateSearch(event){const value=event.currentTarget.value;if(value)searches.set(searchScope(),value);else searches.delete(searchScope());if(!event.isComposing)render();}
  function clearSearch(){searches.delete(searchScope());render();searchInput?.focus();}
  const entries=()=>projectData.filter(p=>(p.teamId||'orchestra-studio')===team()).flatMap(project=>(project.works||[]).map(work=>({project,work,team:team(),account:account(),key:JSON.stringify([project.id,work.id])})));
  function findEntry(key){const entry=entries().find(item=>item.key===key);if(!entry)throw new Error('该成品已不存在，请刷新列表');return entry;}
  function library(){const api=window.orchestraMaterialLibrary;if(!api?.readBlob||!api?.ensureZip)throw new Error('资源读取组件尚未就绪，请稍后重试');return api;}
  const typeOf=r=>({lyrics:'text',song:'audio'}[r.type])||r.type||({'歌词':'text','文本':'text','文字':'text','图片':'image','封面':'image','音频':'audio','歌曲':'audio'}[r.kind])||'unknown';
  const typeLabel=r=>({text:'歌词 / 文本',image:'图片',audio:'音频'}[typeOf(r)])||'资源';
  const resourceTitle=(r,i)=>r.title||r.fileName||`${typeLabel(r)} ${i+1}`;
  const resourceKey=r=>r.sourceMaterialId?`material:${r.sourceMaterialId}`:r.id||JSON.stringify([r.kind,r.url,r.content]);
  const typeNames={text:'文本',audio:'音频',image:'图片',unknown:'资源'};
  const svg=body=>`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const icons={
    audio:svg('<path d="M22 33V15c7 3 13-2 18-4v21M22 22c7 3 13-2 18-4M12 18V7l5 5"/><ellipse cx="17" cy="35" rx="5" ry="6"/><ellipse cx="35" cy="34" rx="5" ry="6"/><circle cx="8" cy="19" r="4"/>'),
    text:svg('<path d="M17 5h12l11 11v22a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z"/><path d="M28 5v10a3 3 0 0 0 3 3h9M20 25h12M20 32h12M20 38h8M8 12H6a3 3 0 0 0-3 3v27a4 4 0 0 0 4 4h22"/>'),
    image:svg('<rect x="5" y="5" width="38" height="38" rx="9"/><circle cx="15" cy="15" r="4"/><path d="M8 38c7-15 17-24 34-8M21 43c6-10 13-13 21-12"/>'),
    back:svg('<path d="m27 14-10 10 10 10M17 24h23"/>'),
    close:svg('<path d="m14 14 20 20M34 14 14 34"/>')
  };
  const resourceIcon=type=>icons[type]||icons.text;
  const typeCounts=resources=>['image','audio','text','unknown'].map(type=>[type,resources.filter(resource=>typeOf(resource)===type).length]).filter(([,count])=>count);
  function formatDate(value){const date=new Date(value);if(Number.isNaN(date.getTime()))return '—';const pad=n=>String(n).padStart(2,'0');return `${date.getFullYear()}/${pad(date.getMonth()+1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;}
  function safeURL(value){if(!value)return '';try{const url=new URL(value,location.href);return ['http:','https:','blob:','file:'].includes(url.protocol)||/^data:(image|audio)\//i.test(value)?url.href:'';}catch{return '';}}
  const mediaState=container=>({container,version:0,urls:new Set(),closed:false});
  function release(state,close=false){state.version++;state.closed=close;state.container.querySelectorAll('audio').forEach(audio=>audio.pause());state.urls.forEach(url=>URL.revokeObjectURL(url));state.urls.clear();}
  function mediaError(element){element.hidden=true;const message=element.parentElement?.querySelector('[data-media-error]');if(message)message.hidden=false;}
  async function hydrate(state,resources){const version=state.version;await Promise.all([...state.container.querySelectorAll('[data-finished-media]')].map(async element=>{
    try{const resource=resources[Number(element.dataset.finishedMedia)];let url;
      if(resource.blobId){const blob=await library().readBlob({...resource,type:typeOf(resource)});if(state.closed||version!==state.version)return;url=URL.createObjectURL(blob);state.urls.add(url);}else url=safeURL(resource.url);
      if(state.closed||version!==state.version)return;if(!url)throw new Error('missing');element.src=url;
    }catch{if(!state.closed&&version===state.version)mediaError(element);}
  }));}
  function preview(resource,index){
    if(typeOf(resource)==='text')return `<pre class="finished-resource-text">${escapeHtml(resource.content||'暂无文本内容')}</pre>`;
    if(typeOf(resource)==='image')return `<div class="finished-media"><img data-finished-media="${index}" alt="${escapeHtml(resourceTitle(resource,index))}" loading="lazy"><p data-media-error hidden>图片暂时无法读取</p></div>`;
    if(typeOf(resource)==='audio')return `<div class="finished-media"><audio controls preload="none" data-finished-media="${index}" aria-label="${escapeHtml(resourceTitle(resource,index))}"></audio><p data-media-error hidden>音频暂时无法读取</p></div>`;
    return '<p class="finished-empty">此资源暂不支持预览</p>';
  }
  const folderKey=()=> 'orchestra-finished-folders-v1:'+team();
  const openFolders=new Map();
  function folderData(){return JSON.parse(localStorage.getItem(folderKey())||'{"folders":[],"locations":{}}');}
  function placeUnfiledWorks(data){
    const unfiled=entries().filter(entry=>!data.folders.some(folder=>folder.id===data.locations[entry.key]));
    if(!unfiled.length)return data;
    let folder=data.folders.find(item=>item.id===data.defaultFolderId);
    if(!folder){
      folder=data.folders.find(item=>item.name==='未分类成品'&&!item.parent);
      if(!folder){folder={id:crypto.randomUUID(),name:'未分类成品',parent:'',createdAt:new Date().toISOString()};data.folders.push(folder);}
      data.defaultFolderId=folder.id;
    }
    for(const entry of unfiled)data.locations[entry.key]=folder.id;
    localStorage.setItem(folderKey(),JSON.stringify(data));
    return data;
  }
  function currentFolder(data){const id=openFolders.get(team());return data.folders.some(f=>f.id===id)?id:'';}
  function folderPath(data,id){
    const names=[],seen=new Set();
    while(id&&!seen.has(id)){seen.add(id);const folder=data.folders.find(f=>f.id===id);if(!folder)break;names.unshift(folder.name);id=folder.parent;}
    return ['成品库',...names].join(' / ');
  }
  function folderDepth(data,id){
    let depth=0;
    const seen=new Set();
    while(id){
      if(seen.has(id))return Infinity;
      seen.add(id);
      const folder=data.folders.find(item=>item.id===id);
      if(!folder)return Infinity;
      depth++;
      id=folder.parent;
    }
    return depth;
  }
  function folderHeight(data,id,ancestors=new Set()){
    if(ancestors.has(id))return Infinity;
    const next=new Set(ancestors);next.add(id);
    const children=data.folders.filter(folder=>folder.parent===id);
    return 1+Math.max(0,...children.map(child=>folderHeight(data,child.id,next)));
  }
  function inside(data,id,ancestor){
    const seen=new Set();
    while(id&&!seen.has(id)){
      if(id===ancestor)return true;
      seen.add(id);id=data.folders.find(f=>f.id===id)?.parent;
    }
    return false;
  }
  function canMoveFolder(data,id,destination){
    return !inside(data,destination,id)&&folderDepth(data,destination)+folderHeight(data,id)<=2;
  }
  function assertFolderEmpty(data,id,projects,teamId){
    const folder=data.folders.find(item=>item.id===id);
    if(!folder)throw Error('该文件夹已不存在，请刷新后重试');
    const hasFolders=data.folders.some(item=>item.parent===id);
    const hasWorks=projects.filter(project=>(project.teamId||'orchestra-studio')===teamId).some(project=>(project.works||[]).some(work=>data.locations[JSON.stringify([project.id,work.id])]===id));
    if(hasFolders||hasWorks)throw Error(`此文件夹内还有${hasFolders&&hasWorks?'子文件夹和成品':hasFolders?'子文件夹':'成品'}，请先移走内容，再删除空文件夹。`);
    return folder;
  }
  function deleteFolder(id){
    const originalTeam=team();
    const check=()=>{
      if(team()!==originalTeam)throw Error('团队已切换，请重新操作');
      const data=folderData(),raw=localStorage.getItem(productionModelKey);
      const folder=assertFolderEmpty(data,id,raw?JSON.parse(raw):projectData,originalTeam);
      return {data,folder};
    };
    const {folder}=check();
    const dialog=document.createElement('dialog');dialog.className='library-form';
    dialog.setAttribute('aria-label','删除空文件夹');
    dialog.innerHTML=`<form><h3>删除文件夹</h3><p>确定删除空文件夹「${escapeHtml(folder.name)}」吗？</p><footer><button type="button">取消</button><button class="finished-folder-delete">删除</button></footer></form>`;
    dialog.querySelector('form').onsubmit=event=>{
      event.preventDefault();
      try{
        const {data,folder:current}=check();
        data.folders=data.folders.filter(item=>item.id!==id);
        for(const key of Object.keys(data.locations))if(data.locations[key]===id)delete data.locations[key];
        if(data.defaultFolderId===id)delete data.defaultFolderId;
        localStorage.setItem(folderKey(),JSON.stringify(data));
        if(openFolders.get(originalTeam)===id)openFolders.set(originalTeam,current.parent||'');
        dialog.close();render();showToast('空文件夹已删除');
      }catch(error){showToast(error.message,'error');}
    };
    dialog.querySelector('[type=button]').onclick=()=>dialog.close();
    dialog.onclose=()=>{dialogs.delete(dialog);dialog.remove();};
    document.body.append(dialog);dialogs.add(dialog);dialog.showModal();
  }
  function folderForm(mode,subject){
    const originalTeam=team(),data=folderData(),parent=currentFolder(data),create=mode==='create';
    if(create&&folderDepth(data,parent)>=2){showToast('最多支持两级文件夹，根目录不计入层级','error');return;}
    const dialog=document.createElement('dialog');dialog.className='library-form';
    dialog.innerHTML=`<form><h3>${create?'新建文件夹':mode==='work'?'将成品移至文件夹':'移动文件夹'}</h3><label>${create?'文件夹名称<input name="folderName" maxlength="50" required>':'目标位置<select name="destination"></select>'}</label><footer><button type="button">取消</button><button>${create?'创建':'确认移动'}</button></footer></form>`;
    const form=dialog.querySelector('form'),fields=form.elements;
    if(!create){
      const dest=fields.destination;
      if(mode==='folder'){if(canMoveFolder(data,subject,''))dest.add(new Option('成品库（根目录）',''));}
      else dest.add(new Option('请选择目标文件夹',''));
      for(const f of data.folders){if(mode!=='folder'||canMoveFolder(data,subject,f.id))dest.add(new Option(folderPath(data,f.id),f.id));}
      const initial=mode==='folder'?data.folders.find(f=>f.id===subject)?.parent:parent;
      if(Array.from(dest.options).some(option=>option.value===initial))dest.value=initial;
    }
    form.onsubmit=event=>{
      event.preventDefault();
      try{
        if(team()!==originalTeam)throw Error('团队已切换，请重新操作');
        const next=folderData(),destination=create?parent:fields.destination.value;
        if(destination&&!next.folders.some(f=>f.id===destination))throw Error('目标文件夹已不存在');
        if(mode==='work'){
          if(!destination)throw Error('请选择目标文件夹');
          findEntry(subject);next.locations[subject]=destination;
        }
        else{
          const folder=create?{id:crypto.randomUUID(),name:fields.folderName.value.trim(),createdAt:new Date().toISOString()}:next.folders.find(f=>f.id===subject);
          if(!folder||!folder.name)throw Error('请填写文件夹名称');
          if(inside(next,destination,folder.id))throw Error('无法移入自身或其子文件夹');
          const height=create?1:folderHeight(next,folder.id);
          if(folderDepth(next,destination)+height>2)throw Error('最多支持两级文件夹，移动时包含子文件夹，根目录不计入层级');
          if(next.folders.some(f=>f.id!==folder.id&&f.parent===destination&&f.name===folder.name))throw Error('此位置已有同名文件夹');
          folder.parent=destination;if(create)next.folders.push(folder);
        }
        localStorage.setItem(folderKey(),JSON.stringify(next));dialog.close();render();showToast(create?'文件夹已创建':'已移动');
      }catch(error){showToast(error.message,'error');}
    };
    dialog.querySelector('[type=button]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
  }
  const folderGrid=document.querySelector('#finishedFolderGrid');
  document.querySelector('#finishedFolderUp').onclick=()=>{
    const data=folderData();openFolders.set(team(),data.folders.find(f=>f.id===currentFolder(data))?.parent||'');clearSearch();
  };
  folderGrid.addEventListener('click',event=>{
    if(event.target.closest('[data-new-folder]'))return folderForm('create');
    const folder=event.target.closest('[data-open-folder],[data-move-folder]');if(!folder)return;
    if(folder.dataset.moveFolder){const item=folderData().folders.find(f=>f.id===folder.dataset.moveFolder);if(item)openMenu(folder,null,item);}
    else{openFolders.set(team(),folder.dataset.openFolder);clearSearch();}
  });
  function render(){
    window.orchestraFinishedExamples?.ensure(team());
    let data;
    try{data=placeUnfiledWorks(folderData());}catch{showToast('成品归类保存失败，请检查浏览器存储空间后重试','error');return;}
    const folder=currentFolder(data);
    document.querySelector('#finishedFolderPath').textContent=folderPath(data,folder);
    document.querySelector('#finishedFolderUp').hidden=!folder;
    closeMenu();const value=searches.get(searchScope())||'',keyword=normalizeSearch(value),all=entries().sort(newestFirst),items=all.filter(({key,work})=>keyword?normalizeSearch(work.name).includes(keyword):(data.locations[key]||'')===folder);
    const folders=keyword?[]:data.folders.filter(f=>f.parent===folder);
    const artwork=window.orchestraMaterialLibrary?.folderArtwork||'';
    folderGrid.hidden=Boolean(keyword);
    folderGrid.innerHTML=`<div class="material-add-card" role="listitem"><button type="button" class="material-new-folder" data-new-folder ${folderDepth(data,folder)>=2?'disabled':''} aria-label="新建文件夹" title="${folderDepth(data,folder)>=2?'最多支持两级文件夹，根目录不计入层级':'新建文件夹'}"><span class="material-folder-cover" aria-hidden="true">${artwork}<span>＋</span></span><span class="material-folder-info"><strong>新建文件夹</strong></span></button></div>`+folders.map(f=>{
      const name=escapeHtml(f.name),id=escapeHtml(f.id),date=f.createdAt?formatDate(f.createdAt).split(' ')[0].replaceAll('/','-'):'';
      return `<div class="material-folder-item" role="listitem"><button type="button" class="material-folder-card" data-open-folder="${id}" aria-label="打开文件夹：${name}"><span class="material-folder-cover" aria-hidden="true">${artwork}</span><span class="material-folder-info"><strong title="${name}">${name}</strong>${date?`<time>${date}</time>`:''}</span></button><button class="material-more-button" type="button" data-move-folder="${id}" aria-label="${name}的更多操作" aria-haspopup="menu" aria-expanded="false">⋯</button></div>`;
    }).join('');
    if(searchInput&&searchInput.value!==value)searchInput.value=value;
    if(clearSearchButton)clearSearchButton.hidden=!value;
    document.querySelector('#finishedWorkCount').textContent=keyword?`找到 ${items.length} 个成品，共 ${all.length} 个成品`:folder?`${folders.length} 个文件夹 · ${items.length} 个成品`:`${folders.length} 个文件夹`;
    grid.innerHTML=items.map(({work,key})=>`<article class="finished-work-card" role="listitem" data-finished-key="${escapeHtml(key)}"><button type="button" class="finished-card-open" data-finished-view aria-label="查看${escapeHtml(work.name)}"><span class="finished-card-types">${typeCounts(work.resources||[]).map(([type,count])=>`<span class="finished-type-tile is-${type}" aria-label="${typeNames[type]} ${count} 个">${resourceIcon(type)}<span>${count}</span></span>`).join('')}</span><h2 title="${escapeHtml(work.name)}">${escapeHtml(work.name)}</h2><time>创建于 ${formatDate(work.createdAt)}</time>${keyword?`<small class="finished-result-location" title="${escapeHtml(folderPath(data,data.locations[key]))}">所在位置 · ${escapeHtml(folderPath(data,data.locations[key]))}</small>`:''}</button><button type="button" class="finished-card-more" data-finished-more aria-label="${escapeHtml(work.name)}的更多操作" aria-haspopup="menu" aria-expanded="false">⋯</button></article>`).join('')||`<p class="finished-empty">${keyword?'未找到匹配的成品，请尝试其他名称或清空搜索。':folder?'此文件夹暂无成品。':'暂无成品，请先在待办的「成品组装」任务中组合成品并提交。'}</p>`;
    grid.hidden=!keyword&&!folder;
    document.querySelector('#finishedListEnd').hidden=!items.length;
    document.querySelector('#finishedListEnd').textContent=keyword?'已显示全部搜索结果':'已显示全部成品';
  }
  function closeMenu(restore=false){if(!activeMenu)return;const {menu,trigger}=activeMenu;activeMenu=null;menu.remove();trigger.setAttribute('aria-expanded','false');if(restore&&trigger.isConnected)trigger.focus();}
  function openMenu(trigger,entry,folder){
    if(activeMenu?.trigger===trigger){closeMenu(true);return;}closeMenu();
    const menu=document.createElement('div');menu.className='finished-action-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label',`${folder?folder.name:entry.work.name}操作`);
    menu.innerHTML=folder?'<button role="menuitem" type="button" data-action="move">移动到</button><button role="menuitem" type="button" data-action="delete-folder">删除</button>':`<button role="menuitem" type="button" data-action="view">查看</button><button role="menuitem" type="button" data-action="edit">编辑</button><button role="menuitem" type="button" data-action="move">移至文件夹</button><button role="menuitem" type="button" data-action="download" ${downloading.has(entry.key)?'disabled':''}>${downloading.has(entry.key)?'正在打包…':'下载'}</button>`;
    document.body.append(menu);const rect=trigger.getBoundingClientRect();menu.style.left=`${Math.max(8,Math.min(rect.right-132,window.innerWidth-140))}px`;menu.style.top=`${Math.max(8,Math.min(rect.bottom+6,window.innerHeight-menu.offsetHeight-8))}px`;
    activeMenu={menu,trigger};trigger.setAttribute('aria-expanded','true');menu.querySelector('button').focus();
    menu.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button||button.disabled)return;closeMenu(true);try{if(folder)return button.dataset.action==='delete-folder'?deleteFolder(folder.id):folderForm('folder',folder.id);const current=findEntry(entry.key);if(button.dataset.action==='move')folderForm('work',entry.key);else if(button.dataset.action==='download')downloadWork(current);else openWork(current,button.dataset.action==='edit');}catch(error){showToast(error.message,'error');}});
    menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeMenu(true);return;}if(event.key==='Tab'){closeMenu(true);return;}const buttons=[...menu.querySelectorAll('button:not(:disabled)')];let i=buttons.indexOf(document.activeElement);if(event.key==='ArrowDown')i=(i+1)%buttons.length;else if(event.key==='ArrowUp')i=(i-1+buttons.length)%buttons.length;else if(event.key==='Home')i=0;else if(event.key==='End')i=buttons.length-1;else return;event.preventDefault();buttons[i].focus();});
  }
  function workflowResources(entry){
    const {project,work}=entry,run=(project.runs||[]).find(item=>String(item.id)===String(work.runId));
    if(!run)return [];
    const resources=new Map();
    function add(resource,selection='selected'){
      const type=typeOf(resource);
      if(!['text','image','audio'].includes(type)||!(type==='text'?String(resource.content||'').trim():resource.url||resource.blobId))return;
      const item={...clone(resource),type,kind:{text:'歌词',image:'图片',audio:'音频'}[type],runId:run.id,planId:run.planId,selectionState:selection};
      item.title=resourceTitle(item,resources.size);resources.set(resourceKey(item),item);
    }
    for(const resource of run.resources||[]){
      if(resource.runId!=null&&String(resource.runId)!==String(run.id))continue;
      add(resource,resource.selectionState==='backup'?'backup':'selected');
    }
    const tasks=typeof productionTasks==='undefined'?[]:productionTasks.filter(task=>task.projectId===project.id&&String(task.workId)===String(run.id));
    function taskResource(task,payload,selected,candidate){
      const type=payload.type==='lyrics'?'text':payload.type==='song'?'audio':payload.type||
        (typeof payload.content==='string'?'text':payload.url||payload.blobId?'audio':'unknown');
      const candidateId=candidate?.id||payload.candidateId||'',generation=candidate?.generationId||candidateId||'output';
      const normalized={...clone(payload),type,kind:{text:'歌词',image:'图片',audio:'音频'}[type],
        id:`workflow:${JSON.stringify([task.id,generation])}`,sourceTaskId:task.id,sourceCandidateId:candidateId,
        sourceGenerationId:candidate?.generationId||'',node:task.nodeTitle,version:payload.version||'V1'};
      // Submitted outputs already exist in run.resources: keep their original IDs for composition/history.
      if(selected){
        const existing=[...resources.values()].filter(resource=>typeOf(resource)===type&&
          (resource.sourceTaskId?resource.sourceTaskId===task.id:String(resource.id).startsWith(`${task.id}-V`)||(!String(resource.id).includes('::')&&resource.node===task.nodeTitle))&&
          (type==='text'?resource.content===normalized.content:resource.blobId?resource.blobId===normalized.blobId:resource.url&&resource.url===normalized.url)).at(-1);
        if(existing){normalized.id=existing.id;normalized.version=existing.version||normalized.version;}
      }
      add(normalized,selected?'selected':'backup');
    }
    for(const task of tasks){
      const output=task.selectedOutput,selectedId=task.selectedCandidateId||(task.status==='completed'?output?.candidateId:'');
      const candidates=task.candidates||[],backups=new Set(Array.isArray(task.backupCandidateIds)?task.backupCandidateIds:[]);
      for(const candidate of candidates){
        const selected=Boolean(selectedId&&candidate.id===selectedId),payload={...candidate};
        if(!selected&&!backups.has(candidate.id))continue;
        if(selected&&output&&(!output.candidateId||output.candidateId===candidate.id))Object.assign(payload,output);
        if(selected&&typeof candidate.content==='string'&&task.selectedCandidateText)payload.content=task.selectedCandidateText;
        taskResource(task,payload,selected,candidate);
      }
      if(output&&task.status==='completed'&&!candidates.some(candidate=>candidate.id===selectedId))taskResource(task,output,true);
    }
    return [...resources.values()].sort((a,b)=>Number(a.selectionState==='backup')-Number(b.selectionState==='backup'));
  }
  function usedByOtherWorks(entry){
    return new Set((entry.project.works||[]).filter(work=>work.id!==entry.work.id&&String(work.runId)===String(entry.work.runId)).flatMap(work=>(work.resources||[]).map(resourceKey)));
  }
  function commitEdit(entry,draft,original,name=entry.work.name,originalName=entry.work.name){
    if(entry.team!==team()||entry.account!==account())throw new Error('账号或团队已变更，请重新打开成品');
    const current=findEntry(entry.key);
    const cleanName=String(name||'').trim();
    if(!cleanName)throw Object.assign(new Error('请输入成品名称'),{field:'name'});
    if(Array.from(cleanName).length>50)throw Object.assign(new Error('成品名称最多 50 个字符'),{field:'name'});
    if(draft.length<1||draft.length>10)throw new Error('每个成品需包含 1～10 个资源');
    if(new Set(draft.map(resourceKey)).size!==draft.length)throw new Error('同一资源不可重复添加');
    if(current.work.name!==originalName||JSON.stringify(current.work.resources||[])!==original)throw new Error('成品已更新，请关闭后重新编辑');
    const raw=localStorage.getItem(productionModelKey),snapshot=clone(raw?JSON.parse(raw):projectData),project=snapshot.find(p=>p.id===entry.project.id),work=project?.works?.find(w=>w.id===entry.work.id);
    if(!work||work.name!==originalName||JSON.stringify(work.resources||[])!==original||String(work.runId)!==String(entry.work.runId))throw new Error('成品已更新，请关闭后重新编辑');
    const source={...current,project,work},existing=new Map(JSON.parse(original).map(resource=>[resourceKey(resource),resource]));
    const catalog=workflowResources(source),occupied=usedByOtherWorks(source);
    const resources=draft.map(resource=>{const key=resourceKey(resource);if(existing.has(key))return clone(existing.get(key));const latest=catalog.find(item=>resourceKey(item)===key);if(!latest)throw new Error('待添加资源已不在该工作流运行中，请重新选择');if(occupied.has(key))throw new Error('该资源已被其他成品使用，请重新选择');return clone(latest);});
    work.name=cleanName;work.resources=resources;work.finishedEditedAt=new Date().toISOString();
    try{localStorage.setItem(productionModelKey,JSON.stringify(snapshot));}catch{throw new Error('保存失败，请检查浏览器存储空间');}
    current.project.works=project.works;return work;
  }
  function openResourcePreview(resource,index=0){
    const returnFocus=document.activeElement,dialog=document.createElement('dialog');
    dialog.className='finished-preview-dialog';dialog.setAttribute('aria-labelledby','finishedPreviewTitle');
    dialog.innerHTML=`<header><h2 id="finishedPreviewTitle">${escapeHtml(resourceTitle(resource,index))}</h2><button type="button" class="finished-icon-button" data-close-preview aria-label="关闭预览">${icons.close}</button></header><div class="finished-preview-content">${preview(resource,0)}</div>`;
    document.body.append(dialog);dialogs.add(dialog);const state=mediaState(dialog);
    dialog.querySelector('[data-close-preview]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('error',event=>{if(event.target.matches('[data-finished-media]'))mediaError(event.target);},true);
    dialog.addEventListener('close',()=>{release(state,true);dialogs.delete(dialog);dialog.remove();if(returnFocus?.isConnected)returnFocus.focus();},{once:true});
    dialog.showModal();hydrate(state,[resource]);return dialog;
  }
  function closeWork(restore=false){
    if(!activeEditor)return;const {state,returnFocus}=activeEditor;activeEditor=null;
    closeDialogs();release(state,true);editorPanel.replaceChildren();editorPanel.hidden=true;listPanel.hidden=false;
    page.classList.remove('is-detail');if(restore&&returnFocus?.isConnected)returnFocus.focus();
  }
  function openWork(entry,editable){
    const returnFocus=activeEditor?.returnFocus||document.activeElement;closeMenu();closeWork();
    const draft=clone(entry.work.resources||[]),original=JSON.stringify(draft),originalName=entry.work.name;
    let activeType='text',catalog=[];
    listPanel.hidden=true;editorPanel.hidden=false;page.classList.add('is-detail');
    editorPanel.innerHTML=`<form class="finished-editor${editable?' is-editing':''}" novalidate>
      <section class="finished-editor-main" aria-label="成品内容">
        <header class="finished-editor-heading">
          <button type="button" class="finished-icon-button finished-back" data-close-work aria-label="返回成品列表">${icons.back}</button>
          <div class="finished-editor-identity">${editable?'<input name="finishedName" class="finished-name-input" type="text" maxlength="100" required aria-label="成品名称" aria-describedby="finishedNameCount finishedEditError" placeholder="请输入成品名称" autocomplete="off"><span id="finishedNameCount" class="finished-name-count" data-finished-name-count></span>':`<h1>${escapeHtml(originalName)}</h1>`}
            <div class="finished-work-meta"><time>创建于 ${formatDate(entry.work.createdAt)}</time><span data-resource-total></span><span class="finished-meta-types" data-resource-types></span></div>
          </div>
          ${editable?'':`<div class="finished-view-actions"><button type="button" class="finished-neutral-button" data-edit-work>编辑成品</button><button type="button" class="finished-neutral-button" data-download-work>下载</button></div>`}
        </header>
        <div class="finished-selected-resources"></div>
      </section>
      ${editable?`<aside class="finished-resource-sidebar" aria-label="成品可选资源">
        <header class="finished-sidebar-heading"><h2>输出资源</h2><button type="button" class="finished-exit" data-close-work>退出编辑</button></header>
        <div class="finished-type-tabs" role="tablist" aria-label="资源类型">${['text','audio','image'].map(type=>`<button type="button" id="finished-tab-${type}" role="tab" data-resource-tab="${type}" aria-controls="finishedResourceResults" aria-selected="${type==='text'}" tabindex="${type==='text'?'0':'-1'}">${typeNames[type]}</button>`).join('')}</div>
        <div class="finished-picker-scroll" id="finishedResourceResults" role="tabpanel" aria-labelledby="finished-tab-text" tabindex="0"><p class="finished-picker-hint" data-picker-hint aria-live="polite"></p><div class="finished-picker-results"></div></div>
        <footer class="finished-editor-footer"><p id="finishedEditError" class="finished-edit-error" role="alert" hidden></p><div><button type="button" class="finished-neutral-button" data-close-work>取消</button><button type="submit" class="finished-save-button">确认修改并保存</button></div></footer>
      </aside>`:''}
    </form>`;
    const form=editorPanel.querySelector('form'),selected=editorPanel.querySelector('.finished-selected-resources'),state=mediaState(selected),results=editorPanel.querySelector('.finished-picker-results'),errorNode=editorPanel.querySelector('.finished-edit-error'),nameInput=editorPanel.querySelector('[name="finishedName"]');
    activeEditor={state,returnFocus,entry};
    function showError(error){if(!errorNode){showToast(error.message,'error');return;}errorNode.textContent=error.message;errorNode.hidden=false;if(error.field==='name'){nameInput.setAttribute('aria-invalid','true');nameInput.focus();}}
    function displaySelected(){
      release(state);
      selected.innerHTML=['text','audio','image','unknown'].map(type=>{
        const items=draft.map((resource,index)=>({resource,index})).filter(({resource})=>typeOf(resource)===type);
        if(!items.length)return '';
        return `<section class="finished-resource-group"><h2>${resourceIcon(type)}${typeNames[type]||'其他'}资源</h2><div class="finished-resource-grid">${items.map(({resource,index})=>`<article class="finished-selected-tile"><button type="button" class="finished-resource-open" data-preview-selected="${index}" aria-label="${type==='audio'?'试听':'预览'}${escapeHtml(resourceTitle(resource,index))}"><span class="finished-resource-art is-${type}">${resourceIcon(type)}${type==='image'?`<img data-finished-media="${index}" loading="lazy" alt="${escapeHtml(resourceTitle(resource,index))}"><span class="finished-media-fallback" data-media-error hidden>图片无法读取</span>`:''}${type==='audio'?'<span class="finished-audio-play">▶</span>':''}</span><b title="${escapeHtml(resourceTitle(resource,index))}">${escapeHtml(resourceTitle(resource,index))}</b></button>${editable?`<button type="button" class="finished-resource-remove" data-remove-resource="${index}" aria-label="移除${escapeHtml(resourceTitle(resource,index))}" title="移除资源">${icons.close}</button>`:''}</article>`).join('')}</div></section>`;
      }).join('')||'<p class="finished-empty">尚未添加资源，请从右侧选择资源。</p>';
      editorPanel.querySelector('[data-resource-total]').textContent=`共 ${draft.length} 个资源文件`;
      editorPanel.querySelector('[data-resource-types]').innerHTML=typeCounts(draft).map(([type,count])=>`<span title="${typeNames[type]||'资源'} ${count} 个">${resourceIcon(type)}${count}</span>`).join('');
      hydrate(state,draft);
    }
    function displayResults(){
      if(!editable)return;
      const keys=new Set(draft.map(resourceKey)),occupied=usedByOtherWorks(entry),count=draft.filter(resource=>typeOf(resource)===activeType).length;
      editorPanel.querySelector('[data-picker-hint]').textContent=`最多添加 10 个资源，已选择 ${count} 个${typeNames[activeType]}，还可选择 ${Math.max(0,10-draft.length)} 个资源`;
      results.innerHTML=[['selected','设为输出的资源'],['backup','备选资源']].map(([group,label])=>{
        const items=catalog.map((record,index)=>({record,index})).filter(({record})=>record.selectionState===group&&typeOf(record)===activeType);
        return `<section class="finished-workflow-group"><h3>${label}</h3>${items.map(({record,index})=>{
          const added=keys.has(resourceKey(record)),used=occupied.has(resourceKey(record));
          return `<article class="finished-picker-result"><button type="button" class="finished-result-preview" data-preview-result="${index}" aria-label="预览${escapeHtml(record.title)}"><span class="finished-result-symbol is-${activeType}">${resourceIcon(activeType)}</span><span><b title="${escapeHtml(record.title)}">${escapeHtml(record.title)}</b><small>${escapeHtml(record.node||'')}</small></span></button><button type="button" class="finished-add-resource${added?' is-added':''}" data-add-resource="${index}" ${added||used||draft.length>=10?'disabled':''} title="${added?'已添加至当前成品':used?'该资源已被其他成品使用':draft.length>=10?'最多添加 10 个资源':'添加至当前成品'}">${added?'✓ 已添加':used?'已使用':'+ 添加'}</button></article>`;
        }).join('')||'<p class="finished-empty">暂无资源</p>'}</section>`;
      }).join('');
    }
    function changeTab(type,focus=false){
      activeType=type;
      editorPanel.querySelectorAll('[data-resource-tab]').forEach(button=>{const active=button.dataset.resourceTab===type;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus();});
      editorPanel.querySelector('#finishedResourceResults').setAttribute('aria-labelledby',`finished-tab-${type}`);
      editorPanel.querySelector('.finished-picker-scroll').scrollTop=0;displayResults();
    }
    if(editable){
      nameInput.value=originalName;
      const updateName=()=>{
        if(!nameInput.matches(':focus'))nameInput.removeAttribute('aria-invalid');
        editorPanel.querySelector('[data-finished-name-count]').textContent=`${Array.from(nameInput.value).length} / 50`;
      };
      nameInput.addEventListener('input',event=>{if(!event.isComposing)nameInput.value=Array.from(nameInput.value).slice(0,50).join('');nameInput.removeAttribute('aria-invalid');errorNode.hidden=true;updateName();});
      nameInput.addEventListener('compositionend',()=>{nameInput.value=Array.from(nameInput.value).slice(0,50).join('');updateName();});updateName();
      try{catalog=workflowResources(entry);}catch(error){showError(error);}
      editorPanel.querySelectorAll('[data-resource-tab]').forEach(button=>{
        button.addEventListener('click',()=>changeTab(button.dataset.resourceTab));
        button.addEventListener('keydown',event=>{const types=['text','audio','image'],index=types.indexOf(activeType);let next;if(event.key==='ArrowRight')next=types[(index+1)%3];else if(event.key==='ArrowLeft')next=types[(index+2)%3];else if(event.key==='Home')next=types[0];else if(event.key==='End')next=types[2];else return;event.preventDefault();changeTab(next,true);});
      });
      results.addEventListener('click',event=>{
        const previewButton=event.target.closest('[data-preview-result]');if(previewButton){const resource=catalog[Number(previewButton.dataset.previewResult)];if(resource)openResourcePreview(resource);return;}
        const button=event.target.closest('[data-add-resource]');if(!button||button.disabled)return;
        const record=catalog[Number(button.dataset.addResource)];if(!record||draft.length>=10||draft.some(r=>resourceKey(r)===resourceKey(record))||usedByOtherWorks(entry).has(resourceKey(record)))return;
        draft.push(clone(record));errorNode.hidden=true;displaySelected();displayResults();
      });
    }else{
      editorPanel.querySelector('[data-edit-work]').addEventListener('click',()=>openWork(findEntry(entry.key),true));
      editorPanel.querySelector('[data-download-work]').addEventListener('click',()=>downloadWork(entry));
    }
    selected.addEventListener('click',event=>{
      const remove=event.target.closest('[data-remove-resource]');if(editable&&remove){draft.splice(Number(remove.dataset.removeResource),1);errorNode.hidden=true;displaySelected();displayResults();return;}
      const button=event.target.closest('[data-preview-selected]');if(button){const resource=draft[Number(button.dataset.previewSelected)];if(resource)openResourcePreview(resource);}
    });
    selected.addEventListener('error',event=>{if(event.target.matches('[data-finished-media]'))mediaError(event.target);},true);
    form.addEventListener('submit',event=>{event.preventDefault();if(!editable)return;try{commitEdit(entry,draft,original,nameInput.value,originalName);closeWork();render();showToast('成品已保存');searchInput?.focus();}catch(error){showError(error);}});
    editorPanel.querySelectorAll('[data-close-work]').forEach(button=>button.addEventListener('click',()=>closeWork(true)));
    displaySelected();displayResults();(nameInput||editorPanel.querySelector('.finished-back')).focus();return editorPanel;
  }
  const fileBase=name=>String(name||'未命名成品').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[.\s]+$/g,'').trim()||'未命名成品';
  function extensionFor(resource,blob){if(typeOf(resource)==='text')return 'txt';const mime=blob.type.split(';')[0],types={'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/webp':'webp','image/avif':'avif','image/svg+xml':'svg','audio/wav':'wav','audio/x-wav':'wav','audio/mpeg':'mp3','audio/mp4':'m4a','audio/ogg':'ogg','audio/flac':'flac','audio/aac':'aac'};if(types[mime])return types[mime];const extension=String(resource.fileName||resource.url||'').split(/[?#]/)[0].match(/\.(png|jpe?g|gif|webp|avif|svg|wav|mp3|m4a|ogg|flac|aac)$/i)?.[1];return extension?.toLowerCase()||(typeOf(resource)==='image'?'png':'wav');}
  async function buildArchive(work){
    if(!work.resources?.length)throw new Error('该成品暂无可下载资源');const api=library(),Zip=await api.ensureZip(),zip=new Zip(),base=fileBase(work.name),counts={};
    for(const [index,resource] of work.resources.entries()){let blob;try{blob=await api.readBlob({...resource,type:typeOf(resource),title:resourceTitle(resource,index)});if(!blob?.size)throw new Error('empty');}catch{throw new Error(`无法读取「${resourceTitle(resource,index)}」，请检查资源后重试`);}const ext=extensionFor(resource,blob),count=(counts[ext]||0)+1;counts[ext]=count;zip.file(`${base}${count>1?` (${count})`:''}.${ext}`,new Uint8Array(await blob.arrayBuffer()));}
    return {name:`${base}.zip`,blob:await zip.generateAsync({type:'blob',compression:'STORE'})};
  }
  async function downloadWork(entry){
    if(downloading.has(entry.key))return;downloading.add(entry.key);let stream;
    try{const work=clone(findEntry(entry.key).work);let handle;
      if(window.showSaveFilePicker)handle=await window.showSaveFilePicker({suggestedName:`${fileBase(work.name)}.zip`,types:[{description:'成品资源压缩包',accept:{'application/zip':['.zip']}}]});
      showToast('正在打包成品资源…');const archive=await buildArchive(work);
      if(handle){stream=await handle.createWritable();await stream.write(archive.blob);await stream.close();stream=null;showToast('下载完成');}
      else{const url=URL.createObjectURL(archive.blob),link=document.createElement('a');link.href=url;link.download=archive.name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);showToast('文件已生成，已交由浏览器下载');}
    }catch(error){if(stream)try{await stream.abort();}catch{}if(error.name!=='AbortError')showToast(error.message||'下载失败，请重试','error');}finally{downloading.delete(entry.key);}
  }
  searchInput?.addEventListener('input',updateSearch);
  searchInput?.addEventListener('compositionend',updateSearch);
  searchInput?.addEventListener('search',updateSearch);
  searchInput?.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.isComposing){event.preventDefault();clearSearch();}});
  clearSearchButton?.addEventListener('click',clearSearch);
  grid.addEventListener('click',event=>{const card=event.target.closest('[data-finished-key]');if(!card)return;try{const entry=findEntry(card.dataset.finishedKey),more=event.target.closest('[data-finished-more]');if(more)openMenu(more,entry);else if(event.target.closest('[data-finished-view]'))openWork(entry,false);}catch(error){showToast(error.message,'error');}});
  document.addEventListener('pointerdown',event=>{if(activeMenu&&!activeMenu.menu.contains(event.target)&&!activeMenu.trigger.contains(event.target))closeMenu();});
  window.addEventListener('resize',()=>closeMenu());window.addEventListener('scroll',()=>closeMenu(),true);
  const closeDialogs=()=>[...dialogs].forEach(dialog=>dialog.close());
  let pageWasActive=page.classList.contains('active');
  new MutationObserver(()=>{const active=page.classList.contains('active');if(active===pageWasActive)return;pageWasActive=active;if(active)render();else{closeMenu();closeWork();closeDialogs();}}).observe(page,{attributes:true,attributeFilter:['class']});
  // Delegation also covers teams created after this page initialized.
  document.addEventListener('click',event=>{if(event.target.closest('.workspace-option')){closeWork();closeDialogs();render();}});
  window.addEventListener('storage',event=>{if(event.key===folderKey())render();if(event.key===productionModelKey){closeWork();closeDialogs();try{const saved=JSON.parse(event.newValue);if(Array.isArray(saved))projectData.splice(0,projectData.length,...saved);}catch{}render();}});
  window.addEventListener('pagehide',()=>{closeMenu();closeWork();closeDialogs();});
  document.addEventListener('DOMContentLoaded',render,{once:true});
  window.orchestraFinishedLibrary={render};render();
})();
