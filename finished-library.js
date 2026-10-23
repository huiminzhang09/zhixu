/* Finished works use resource snapshots; edits are committed only on Save. */
function renderFinishedLibrary(){ window.orchestraFinishedLibrary?.render(); }
(()=>{
  const grid=document.querySelector('#finishedWorkGrid'),page=document.querySelector('#finishedPage');
  const dialogs=new Set(),downloading=new Set();
  const searchInput=document.querySelector('#finishedWorkSearch'),clearSearchButton=document.querySelector('#clearFinishedWorkSearch'),searches=new Map();
  let activeMenu=null;
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
  const musicIcon='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 34V12l22-5v22M19 20l22-5"/><ellipse cx="12" cy="35" rx="7" ry="5"/><ellipse cx="34" cy="30" rx="7" ry="5"/></svg>';
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
  function resourceMarkup(resource,index,editable){return `<article class="finished-resource"><header><div><b>${escapeHtml(resourceTitle(resource,index))}</b><small>${typeLabel(resource)}</small></div>${editable?`<button type="button" class="finished-remove" data-remove-resource="${index}" aria-label="移除${escapeHtml(resourceTitle(resource,index))}">移除</button>`:''}</header>${preview(resource,index)}</article>`;}
  const cardState=mediaState(grid);
  function render(){
    closeMenu();release(cardState);const value=searches.get(searchScope())||'',keyword=normalizeSearch(value),all=entries().sort(newestFirst),items=keyword?all.filter(({work})=>normalizeSearch(work.name).includes(keyword)):all,covers=[];
    if(searchInput&&searchInput.value!==value)searchInput.value=value;
    if(clearSearchButton)clearSearchButton.hidden=!value;
    document.querySelector('#finishedWorkCount').textContent=keyword?`找到 ${items.length} 个成品，共 ${all.length} 个成品`:`共 ${items.length} 个成品`;
    grid.innerHTML=items.map(({work,key})=>{const cover=(work.resources||[]).find(r=>typeOf(r)==='image'),index=covers.length;if(cover)covers.push(cover);const date=new Date(work.createdAt);return `<article class="finished-work-card" role="listitem" data-finished-key="${escapeHtml(key)}"><button type="button" class="finished-card-open" data-finished-view aria-label="查看${escapeHtml(work.name)}"><div class="finished-card-cover"><span class="finished-card-symbol">${musicIcon}</span>${cover?`<img data-finished-media="${index}" alt="" loading="lazy"><span data-media-error hidden></span>`:''}<span class="finished-card-count">${(work.resources||[]).length} 个资源</span></div><div class="finished-card-info"><h2 title="${escapeHtml(work.name)}">${escapeHtml(work.name)}</h2><time>创建于 ${Number.isNaN(date.getTime())?'—':date.toLocaleString('zh-CN',{hour12:false})}</time></div></button><button type="button" class="finished-card-more" data-finished-more aria-label="${escapeHtml(work.name)}的更多操作" aria-haspopup="menu" aria-expanded="false">⋯</button></article>`;}).join('')||'<p class="finished-empty">暂无成品，请先在待办的「成品组装」任务中组合成品并提交。</p>';
    if(keyword&&!items.length)grid.innerHTML='<p class="finished-empty">未找到匹配的成品，请尝试其他名称或清空搜索。</p>';
    hydrate(cardState,covers);
  }
  function closeMenu(restore=false){if(!activeMenu)return;const {menu,trigger}=activeMenu;activeMenu=null;menu.remove();trigger.setAttribute('aria-expanded','false');if(restore&&trigger.isConnected)trigger.focus();}
  function openMenu(trigger,entry){
    if(activeMenu?.trigger===trigger){closeMenu(true);return;}closeMenu();
    const menu=document.createElement('div');menu.className='finished-action-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label',`${entry.work.name}操作`);
    menu.innerHTML=`<button role="menuitem" type="button" data-action="view">查看</button><button role="menuitem" type="button" data-action="edit">编辑</button><button role="menuitem" type="button" data-action="download" ${downloading.has(entry.key)?'disabled':''}>${downloading.has(entry.key)?'正在打包…':'下载'}</button>`;
    document.body.append(menu);const rect=trigger.getBoundingClientRect();menu.style.left=`${Math.max(8,Math.min(rect.right-132,window.innerWidth-140))}px`;menu.style.top=`${Math.max(8,Math.min(rect.bottom+6,window.innerHeight-menu.offsetHeight-8))}px`;
    activeMenu={menu,trigger};trigger.setAttribute('aria-expanded','true');menu.querySelector('button').focus();
    menu.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button||button.disabled)return;closeMenu(true);try{const current=findEntry(entry.key);if(button.dataset.action==='download')downloadWork(current);else openWork(current,button.dataset.action==='edit');}catch(error){showToast(error.message,'error');}});
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
  function commitEdit(entry,draft,original){
    if(entry.team!==team()||entry.account!==account())throw new Error('账号或团队已变更，请重新打开成品');
    const current=findEntry(entry.key);
    if(draft.length<1||draft.length>10)throw new Error('每个成品需包含 1～10 个资源');
    if(new Set(draft.map(resourceKey)).size!==draft.length)throw new Error('同一资源不可重复添加');
    if(JSON.stringify(current.work.resources||[])!==original)throw new Error('成品已更新，请关闭后重新编辑');
    const raw=localStorage.getItem(productionModelKey),snapshot=clone(raw?JSON.parse(raw):projectData),project=snapshot.find(p=>p.id===entry.project.id),work=project?.works?.find(w=>w.id===entry.work.id);
    if(!work||JSON.stringify(work.resources||[])!==original||String(work.runId)!==String(entry.work.runId))throw new Error('成品已更新，请关闭后重新编辑');
    const source={...current,project,work},existing=new Map(JSON.parse(original).map(resource=>[resourceKey(resource),resource]));
    const catalog=workflowResources(source),occupied=usedByOtherWorks(source);
    const resources=draft.map(resource=>{const key=resourceKey(resource);if(existing.has(key))return clone(existing.get(key));const latest=catalog.find(item=>resourceKey(item)===key);if(!latest)throw new Error('待添加资源已不在该工作流运行中，请重新选择');if(occupied.has(key))throw new Error('该资源已被其他成品使用，请重新选择');return clone(latest);});
    work.resources=resources;work.finishedEditedAt=new Date().toISOString();
    try{localStorage.setItem(productionModelKey,JSON.stringify(snapshot));}catch{throw new Error('保存失败，请检查浏览器存储空间');}
    current.project.works=project.works;return work;
  }
  function openWork(entry,editable){
    const draft=clone(entry.work.resources||[]),original=JSON.stringify(draft),returnFocus=document.activeElement;
    const dialog=document.createElement('dialog');dialog.className=`finished-dialog${editable?' is-editing':''}`;dialog.setAttribute('aria-labelledby','finishedDialogTitle');
    dialog.innerHTML=`<form><header class="finished-dialog-heading"><div><small>${editable?'编辑成品':'查看成品'}</small><h2 id="finishedDialogTitle">${escapeHtml(entry.work.name)}</h2></div><button type="button" data-close-finished aria-label="关闭">×</button></header><div class="finished-dialog-content"><section class="finished-selected-section"><h3>${editable?'当前资源':'全部资源'} <span data-resource-count></span></h3><div class="finished-selected-resources"></div></section>${editable?'<section class="finished-picker-section" aria-label="工作流选中与备选资源"><div class="finished-picker-results"></div></section>':''}</div><p class="finished-dialog-error" role="alert" hidden></p><footer>${editable?'<small>最多添加 10 个资源，点击保存后生效</small>':''}<div><button type="button" class="secondary-button" data-close-finished>${editable?'取消':'关闭'}</button>${editable?'<button type="submit" class="primary-button">保存</button>':''}</div></footer></form>`;
    document.body.append(dialog);dialogs.add(dialog);
    const selected=dialog.querySelector('.finished-selected-resources'),selectedState=mediaState(selected),results=dialog.querySelector('.finished-picker-results'),resultState=results?mediaState(results):null,form=dialog.querySelector('form'),errorNode=dialog.querySelector('.finished-dialog-error');
    let catalog=[];
    function displaySelected(){release(selectedState);selected.innerHTML=draft.map((resource,index)=>resourceMarkup(resource,index,editable)).join('')||'<p class="finished-empty">尚未添加资源</p>';dialog.querySelector('[data-resource-count]').textContent=editable?`${draft.length} / 10`:`${draft.length} 个`;hydrate(selectedState,draft);}
    function displayResults(){
      if(!editable)return;release(resultState);
      const keys=new Set(draft.map(resourceKey)),occupied=usedByOtherWorks(entry);
      results.innerHTML=[['selected','选中资源'],['backup','备选资源']].map(([group,label])=>{
        const items=catalog.map((record,index)=>({record,index})).filter(({record})=>record.selectionState===group);
        return `<section class="finished-workflow-group"><h3>${label}<span>${items.length} 个</span></h3>${items.map(({record,index})=>{
          const added=keys.has(resourceKey(record)),used=occupied.has(resourceKey(record));
          return `<article class="finished-picker-result"><header><div><b>${escapeHtml(record.title)}</b><small>${escapeHtml([record.node,record.version].filter(Boolean).join(' · ')||typeLabel(record))}</small></div><button type="button" data-add-resource="${index}" ${added||used||draft.length>=10?'disabled':''}>${added?'已添加':used?'其他成品已使用':'添加'}</button></header><details><summary>预览${typeLabel(record)}</summary>${preview(record,index)}</details></article>`;
        }).join('')||`<p class="finished-empty">该运行暂无${label}</p>`}</section>`;
      }).join('');
      hydrate(resultState,catalog);
    }
    function showError(error){errorNode.textContent=error.message;errorNode.hidden=false;}
    if(editable){try{catalog=workflowResources(entry);}catch(error){showError(error);}
      selected.addEventListener('click',event=>{const button=event.target.closest('[data-remove-resource]');if(!button)return;draft.splice(Number(button.dataset.removeResource),1);displaySelected();displayResults();});
      results.addEventListener('click',event=>{const button=event.target.closest('[data-add-resource]');if(!button||button.disabled)return;const record=catalog[Number(button.dataset.addResource)];if(!record||draft.length>=10||draft.some(r=>resourceKey(r)===resourceKey(record))||usedByOtherWorks(entry).has(resourceKey(record)))return;draft.push(clone(record));displaySelected();displayResults();});
    }
    form.addEventListener('submit',event=>{event.preventDefault();if(!editable)return;try{commitEdit(entry,draft,original);dialog.close();render();showToast('成品已保存');}catch(error){showError(error);}});
    dialog.querySelectorAll('[data-close-finished]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('error',event=>{if(event.target.matches('[data-finished-media]'))mediaError(event.target);},true);
    dialog.addEventListener('play',event=>dialog.querySelectorAll('audio').forEach(audio=>{if(audio!==event.target)audio.pause();}),true);
    dialog.addEventListener('close',()=>{release(selectedState,true);if(resultState)release(resultState,true);dialogs.delete(dialog);dialog.remove();if(returnFocus?.isConnected)returnFocus.focus();},{once:true});
    displaySelected();displayResults();dialog.showModal();return dialog;
  }
  const fileBase=name=>String(name||'未命名作品').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[.\s]+$/g,'').trim()||'未命名作品';
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
  grid.addEventListener('error',event=>{if(event.target.matches('[data-finished-media]'))mediaError(event.target);},true);
  document.addEventListener('pointerdown',event=>{if(activeMenu&&!activeMenu.menu.contains(event.target)&&!activeMenu.trigger.contains(event.target))closeMenu();});
  window.addEventListener('resize',()=>closeMenu());window.addEventListener('scroll',()=>closeMenu(),true);
  const closeDialogs=()=>[...dialogs].forEach(dialog=>dialog.close());
  new MutationObserver(()=>{if(page.classList.contains('active'))render();else{closeMenu();release(cardState);closeDialogs();}}).observe(page,{attributes:true,attributeFilter:['class']});
  document.querySelectorAll('.workspace-option').forEach(button=>button.addEventListener('click',()=>{closeDialogs();render();}));
  window.addEventListener('storage',event=>{if(event.key===productionModelKey){closeDialogs();try{const saved=JSON.parse(event.newValue);if(Array.isArray(saved))projectData.splice(0,projectData.length,...saved);}catch{}render();}});
  window.addEventListener('pagehide',()=>{closeMenu();closeDialogs();release(cardState,true);});
  document.addEventListener('DOMContentLoaded',render,{once:true});
  window.orchestraFinishedLibrary={render};render();
})();
