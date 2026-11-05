/* A final workflow task combines selected and backup resources into finished works. */
(() => {
  const runId='DEMO-WORK-OUTPUT-001',planId='DEMO-WORK-OUTPUT-PLAN';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const session=()=>JSON.stringify([localStorage.getItem('orchestra-demo-account'),localStorage.getItem('orchestra-workspace')]);
  const kind=resource=>({text:'歌词',lyrics:'歌词',audio:'音频',song:'音频',image:'图片'}[resource.type])||resource.kind;
  const title=resource=>String(resource.title||resource.kind||'资源').split('·')[0].trim()||'资源';
  let mountedTask='',mountedSession='',submitting=false,initialized=false;
  const editorStates=new Map(),previewDialogs=new Set();
  function stopAudio(){taskDetailPanel.querySelectorAll('audio').forEach(audio=>audio.pause());previewDialogs.forEach(dialog=>dialog.querySelectorAll('audio').forEach(audio=>audio.pause()))}
  function closePreviews(){previewDialogs.forEach(dialog=>dialog.close());previewDialogs.clear()}
  function resourcesFor(task){
    const context=taskContextByTask(task);if(!context)return [];
    return (context.work.resources||[]).filter(resource=>['selected','backup'].includes(resource.selectionState));
  }
  function draftsFor(task){
    if(!Array.isArray(task.outputDrafts))task.outputDrafts=[{name:'',nameManual:false,resourceIds:[]}];
    task.outputDrafts.forEach(draft=>{draft.resourceIds=(draft.resourceIds||[]).filter(Boolean);draft.name=String(draft.name||'');if(draft.nameManual===undefined)draft.nameManual=Boolean(draft.name)});
    return task.outputDrafts;
  }
  function mediaURL(resource){
    if(!resource.url)return '';
    try{const url=new URL(resource.url,location.href);return ['https:','http:','file:','blob:'].includes(url.protocol)||/^data:(image|audio)\//i.test(resource.url)?url.href:''}catch{return ''}
  }
  function preview(resource){
    if(!resource)return '';
    const type=kind(resource),url=mediaURL(resource);
    if(['歌词','文本','文字'].includes(type))return `<details class="output-text-preview"><summary>查看歌词 / 文本</summary><pre>${escapeHtml(resource.content||'暂无文本内容')}</pre></details>`;
    if(type==='音频')return url?`<audio controls preload="none" src="${escapeHtml(url)}" aria-label="试听 ${escapeHtml(title(resource))}"></audio>`:'<p class="output-media-empty">暂无可播放音频</p>';
    if(['图片','封面'].includes(type))return url?`<details class="output-image-preview"><summary>查看图片</summary><img src="${escapeHtml(url)}" alt="${escapeHtml(title(resource))}" loading="lazy"></details>`:'<p class="output-media-empty">暂无图片</p>';
    return '<p class="output-media-empty">暂不支持预览此资源</p>';
  }
  function validateDrafts(task,drafts=draftsFor(task)){
    const resources=new Map(resourcesFor(task).map(resource=>[resource.id,resource])),used=new Set();
    if(!drafts.length)throw Error('请至少配置一个成品');
    return drafts.map((draft,index)=>{
      const name=String(draft.name||'').trim();
      if(!name)throw Error(`请填写成品 ${index+1} 的名称`);
      if(Array.from(name).length>50)throw Error(`成品 ${index+1} 的名称最多 50 个字符`);
      if(!draft.resourceIds?.length||draft.resourceIds.length>10)throw Error(`成品 ${index+1} 需要选择 1～10 个资源`);
      const chosen=draft.resourceIds.map(id=>{
        if(!resources.has(id))throw Error(`请为成品 ${index+1} 选择有效资源`);
        if(used.has(id))throw Error('同一资源不能重复选择或用于多个成品');
        used.add(id);return resources.get(id);
      });
      return {name,resources:chosen};
    });
  }
  function editorState(task){
    const key=session()+':'+task.id;
    if(!editorStates.has(key))editorStates.set(key,{active:0,collapsed:new Set(),type:'text',hideAdded:false});
    const state=editorStates.get(key);state.active=Math.max(0,Math.min(state.active,draftsFor(task).length-1));return state;
  }
  const nodeName=resource=>resource.node||resource.nodeTitle||'未记录产出节点';
  function resourceIcon(resource){
    const type=kind(resource),audio=type==='音频',image=['图片','封面'].includes(type);
    const path=audio?'<path d="M9 17V6l10-2v11M9 9l10-2"/><ellipse cx="6" cy="17" rx="3" ry="3"/><ellipse cx="16" cy="15" rx="3" ry="3"/>':image?'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/>':'<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>';
    return `<span class="output-resource-icon ${audio?'is-audio':image?'is-image':'is-text'}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg></span>`;
  }
  const trashIcon='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M3 5h14M7 5V3h6v2M5 5l1 12h8l1-12M8 8v6M12 8v6"/></svg>';
  const chevronIcon='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 12 4-4 4 4"/></svg>';
  function previewButton(resource){
    const audio=kind(resource)==='音频';
    return `<button type="button" class="output-preview-button${audio?' is-audio':''}" data-output-preview="${escapeHtml(resource.id)}" aria-label="${audio?'试听':'预览'}${escapeHtml(title(resource))}">${audio?'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M5 2.5 13 8l-8 5.5z"/></svg>':''}${audio?'试听':'预览'}</button>`;
  }
  const resourceType=resource=>kind(resource)==='音频'?'audio':['图片','封面'].includes(kind(resource))?'image':'text';
  const resourceTypes=[['text','文本'],['audio','音频'],['image','图片']];
  const assemblyIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 5 3v6l-5 3-5-3V5zM7 11l-5 3v6l5 3 5-3v-6m5-3 5 3v6l-5 3-5-3M7 5l5 3 5-3M12 8v6M2 14l5 3 5-3 5 3 5-3M7 17v6m10-6v6"/></svg>';
  function inlineMedia(resource){
    const type=resourceType(resource),url=mediaURL(resource);
    if(type==='text')return `<pre class="output-text-content" tabindex="0" aria-label="${escapeHtml(title(resource))}正文">${escapeHtml(resource.content||'暂无文本内容')}</pre>`;
    if(type==='audio')return preview(resource);
    return url?`<button type="button" class="output-image-button" data-output-preview="${escapeHtml(resource.id)}" aria-label="预览${escapeHtml(title(resource))}"><img src="${escapeHtml(url)}" alt="${escapeHtml(title(resource))}" loading="lazy" draggable="false"></button>`:'<p class="output-media-empty">暂无图片</p>';
  }
  function workCard(task,draft,index,resources,workCount){
    const state=editorState(task),active=state.active===index,collapsed=state.collapsed.has(index);
    const rows=draft.resourceIds.map((id,slot)=>({resource:resources.find(item=>item.id===id),slot}));
    return `<article class="output-work-card${active?' is-active':''}" data-output-work="${index}" aria-label="成品 ${index+1}">
      <header><p class="output-name-hint">配置资源后自动匹配名称，可手动修改名称</p><div class="output-work-title">
      <button type="button" class="output-card-select" data-output-select-work="${index}" aria-label="选择成品 ${index+1}" aria-pressed="${active}" aria-controls="outputWorkBody-${index}"><span class="output-work-number">${String(index+1).padStart(2,'0')}</span></button>
      <input class="output-name-input" data-output-name="${index}" value="${escapeHtml(draft.name)}" maxlength="100" placeholder="未命名" aria-label="成品 ${index+1} 名称，最多 50 个字符" required>
      <span class="output-name-counter" data-output-name-count="${index}">${Array.from(draft.name).length} / 50</span>
      <div class="output-card-actions">${workCount>1?`<button type="button" class="output-icon-button output-delete-work" data-output-remove-work="${index}" aria-label="删除成品 ${index+1}" title="删除成品">${trashIcon}</button>`:''}<button type="button" class="output-collapse" data-output-collapse-work="${index}" aria-expanded="${!collapsed}" aria-controls="outputWorkBody-${index}">${collapsed?'展开':'折叠'} ${chevronIcon}</button></div></div></header>
      <div class="output-work-content" id="outputWorkBody-${index}" ${collapsed?'hidden':''}>
      ${resourceTypes.map(([type,label])=>{
        const items=rows.filter(row=>row.resource&&resourceType(row.resource)===type);
        return `<section class="output-selected-group is-${type}"><h4>${resourceIcon({type})}${label}${items.length?`<small>${items.length}</small>`:''}</h4>
        <div class="output-drop-area${items.length?' has-resources':''}" data-output-drop-work="${index}" data-output-drop-type="${type}" aria-label="成品 ${index+1} 的${label}资源">
        ${items.length?items.map(({resource,slot})=>`<article class="output-selected-resource is-${type}"><header><b title="${escapeHtml(title(resource))}">${escapeHtml(title(resource))}</b><div>${type==='image'?'':previewButton(resource)}<button type="button" class="output-icon-button output-remove-resource" data-output-remove-resource="${index}:${slot}" aria-label="移除成品 ${index+1} 的资源 ${escapeHtml(title(resource))}" title="移除资源">×</button></div></header>${inlineMedia(resource)}</article>`).join(''):
        `<button type="button" class="output-empty-drop" data-output-open-type="${type}" data-output-target-work="${index}" aria-label="为成品 ${index+1} 选择${label}资源"><span aria-hidden="true">＋</span><small>可从左侧资源列表拖拽至此进行添加</small></button>`}</div></section>`;
      }).join('')}
      ${rows.filter(row=>!row.resource).map(({slot})=>`<p class="output-invalid-resource">资源已失效，请移除后重新添加 <button type="button" data-output-remove-resource="${index}:${slot}">移除</button></p>`).join('')}</div></article>`;
  }
  function sourcePanel(task,resources){
    const drafts=draftsFor(task),state=editorState(task),draft=drafts[state.active],selected=draft?.resourceIds||[],full=selected.length>=10;
    const count=selected.filter(id=>resources.some(resource=>resource.id===id&&resourceType(resource)===state.type)).length;
    const typeLabel=resourceTypes.find(([type])=>type===state.type)[1];
    const filtered=resources.filter(resource=>resourceType(resource)===state.type&&(!state.hideAdded||!drafts.some(item=>item.resourceIds.includes(resource.id))));
    return `<div class="output-source-header"><div class="output-section-heading"><h3>结果资源信息</h3><div class="output-visibility" role="group" aria-label="资源显示范围"><button type="button" data-output-visibility="all" aria-pressed="${!state.hideAdded}">全部显示</button><button type="button" data-output-visibility="available" aria-pressed="${state.hideAdded}">隐藏已添加</button></div></div>
      <div class="output-type-tabs" role="tablist" aria-label="结果资源类型">${resourceTypes.map(([type,label])=>`<button type="button" role="tab" id="outputTab-${type}" data-output-type="${type}" aria-selected="${state.type===type}" aria-controls="outputResourceList" tabindex="${state.type===type?'0':'-1'}">${label}</button>`).join('')}</div></div>
      <div class="output-source-groups" id="outputResourceList" role="tabpanel" aria-labelledby="outputTab-${state.type}" tabindex="0"><p class="output-source-hint">最多添加 10 个资源，已选择 ${count} 个${typeLabel}，还可选择 ${Math.max(0,10-selected.length)} 个资源${drafts.length>1?`<br>当前添加至：成品 ${state.active+1}`:''}</p>
      ${[['selected','输出资源'],['backup','备选资源']].map(([status,label])=>{
        const items=filtered.filter(resource=>resource.selectionState===status);
        return `<section class="output-source-group"><h4>${label} <span>${items.length}</span></h4><div class="output-source-items is-${state.type}">${items.map(resource=>{
          const owner=drafts.findIndex(item=>item.resourceIds.includes(resource.id)),occupied=owner!==-1,added=owner===state.active;
          const label=added?'已添加':occupied?`成品 ${owner+1} 已用`:'添加';
          const add=`<button type="button" class="output-pick-resource${occupied?' is-added':''}" data-output-pick-resource="${escapeHtml(resource.id)}" ${occupied||full?'disabled':''} title="${occupied?`已添加至成品 ${owner+1}`:full?'当前成品最多添加 10 个资源':`添加至成品 ${state.active+1}`}">${label}</button>`;
          return `<article class="output-source-resource is-${state.type}" data-output-drag-resource="${escapeHtml(resource.id)}" draggable="${!occupied&&!full}" title="${escapeHtml(nodeName(resource))}">${state.type==='image'?`<div class="output-source-image">${inlineMedia(resource)}${add}</div><b class="output-image-name">${escapeHtml(title(resource))}</b>`:`<header><b>${escapeHtml(title(resource))}</b>${add}</header>${inlineMedia(resource)}`}</article>`;
        }).join('')}</div>${items.length?'':`<p class="output-media-empty">${state.hideAdded&&resources.some(resource=>resource.selectionState===status&&resourceType(resource)===state.type)?'该分类资源已全部添加':'暂无资源'}</p>`}</section>`;
      }).join('')}</div>`;
  }
  function composerHint(task){
    const state=editorState(task),count=draftsFor(task)[state.active]?.resourceIds.length||0;
    return `选择左侧输出与备选资源进行成品组合。每个成品可添加 1～10 个资源，已选择 ${count} 个资源，还可选择 ${Math.max(0,10-count)} 个资源`;
  }
  function syncSubmitState(task){
    let valid=true;try{validateDrafts(task)}catch{valid=false}
    const button=taskDetailPanel.querySelector('[data-output-submit]');if(button)button.disabled=!valid;
    const badge=taskDetailPanel.querySelector('[data-output-config-status]');if(badge)badge.textContent=valid?'已配置':'待配置';
  }
  function refreshSourcePanel(task){
    const source=taskDetailPanel.querySelector('.output-source-panel');if(!source)return;
    const top=source.querySelector?.('.output-source-groups')?.scrollTop||0;
    source.innerHTML=sourcePanel(task,resourcesFor(task));
    const list=source.querySelector?.('.output-source-groups');if(list)list.scrollTop=top;
  }
  function updateEditingState(task){
    const state=editorState(task);
    taskDetailPanel.querySelectorAll('[data-output-work]').forEach(card=>{
      const active=Number(card.dataset.outputWork)===state.active;card.classList.toggle('is-active',active);
      card.querySelector('[data-output-select-work]')?.setAttribute('aria-pressed',String(active));
    });
    refreshSourcePanel(task);
    const hint=taskDetailPanel.querySelector('[data-output-composer-hint]');if(hint)hint.textContent=composerHint(task);
  }
  function selectWork(task,index){
    if(!Number.isInteger(index)||!draftsFor(task)[index])return;
    const state=editorState(task);if(state.active===index)return;state.active=index;updateEditingState(task);
  }
  function openResourcePreview(task,id){
    const resource=resourcesFor(task).find(item=>item.id===id);if(!resource){showError('资源已失效，请刷新后重试');return}
    const trigger=document.activeElement;
    stopAudio();closePreviews();
    const dialog=modelDialog(title(resource),`<p>${escapeHtml(nodeName(resource))}</p><div class="output-preview-content">${preview(resource).replace('<details ','<details open ')}</div>`,'output-preview-dialog');
    previewDialogs.add(dialog);dialog.addEventListener('close',()=>{previewDialogs.delete(dialog);if(trigger?.isConnected)trigger.focus()},{once:true});
  }
  function render(task){
    const same=mountedTask===task.id&&mountedSession===session();
    const scrolls=['.output-work-list','.output-source-groups'].map(selector=>[selector,same?(taskDetailPanel.querySelector(selector)?.scrollTop||0):0]);
    if(!same)closePreviews();stopAudio();
    mountedTask=task.id;mountedSession=session();
    const context=taskContextByTask(task),resources=resourcesFor(task),active=task.status==='in_progress',status=taskStatusMeta[task.status];
    const drafts=active?draftsFor(task):[],used=new Set(drafts.flatMap(draft=>draft.resourceIds));
    const works=(context?.project.works||[]).filter(work=>work.runId===task.workId);
    taskDetailPanel.innerHTML=`<div class="work-output-workbench"><header class="task-detail-header output-task-header"><div class="output-task-title"><span class="task-detail-kicker" hidden></span><h2>成品组装</h2>${active?'<span class="output-config-badge"><span aria-hidden="true">▤</span> <span data-output-config-status>待配置</span></span>':''}</div><p>${assemblyIcon}<span>组合当前工作流的输出与备选资源，提交后生成成品。</span></p><span class="output-run-status ${active?'is-running':''}">· ${escapeHtml(status.label)}</span></header>
      ${active?`<div class="output-task-body"><aside class="output-source-panel" aria-label="结果资源信息">${sourcePanel(task,resources)}</aside><section class="output-composer" aria-label="成品组装"><div class="output-composer-header"><div class="output-section-heading"><h3>成品</h3><button type="button" class="output-secondary" data-output-add-work ${used.size>=resources.length?'disabled':''}>＋ 新增成品</button></div><p data-output-composer-hint>${composerHint(task)}</p></div>
      <div class="output-work-list">${drafts.map((draft,index)=>workCard(task,draft,index,resources,drafts.length)).join('')}</div>
      <footer class="output-task-footer"><p class="output-form-error" role="alert" hidden></p><div><button type="button" class="task-return-button" data-task-action="return">打回</button><button type="button" class="output-submit" data-output-submit disabled>确认提交</button></div></footer></section></div>`:
      `<section class="output-completed" aria-label="已输出成品"><div class="output-section-heading"><div><h3>${works.length?'成品已输出':'该任务已结束'}</h3><p>${works.length?`已生成 ${works.length} 个成品，可查看全部资源。`:'该任务未输出成品。'}</p></div>${works.length?'<button type="button" class="output-secondary" data-output-view-finished>查看成品</button>':''}</div>${works.map(work=>`<article class="output-work-card"><header><h3>${escapeHtml(work.name)}</h3><span>${work.resources.length} 个资源</span></header>${work.resources.map(resource=>`<div class="output-completed-resource"><header><b>${escapeHtml(title(resource))}</b><small>${escapeHtml(nodeName(resource))}</small></header>${preview(resource)}</div>`).join('')}</article>`).join('')}</section>`}</div>`;
    scrolls.forEach(([selector,top])=>{const list=taskDetailPanel.querySelector(selector);if(list)list.scrollTop=top});
    if(active)syncSubmitState(task);
  }
  function showError(message){const node=taskDetailPanel.querySelector('.output-form-error');if(node){node.textContent=message;node.hidden=!message}if(message)showToast(message,'error')}
  function activeTask(){
    const task=productionTasks.find(item=>item.id===selectedTaskId);
    return task?.id===mountedTask&&task.nodeType==='workOutput'&&task.status==='in_progress'&&session()===mountedSession?task:null;
  }
  function saveDraft(task,refresh=true){
    if(!persistProductionTasks())showError('草稿保存失败，请检查浏览器存储后重试');
    if(refresh)renderTaskCenter();
  }
  function requestSubmit(task){
    if(submitting||activeTask()!==task)return;
    let drafts;try{drafts=validateDrafts(task)}catch(error){showError(error.message);return}
    const origin=mountedSession,signature=JSON.stringify(task.outputDrafts);
    const dialog=modelDialog('确认输出成品',`<p>本次将输出 ${drafts.length} 个成品、${drafts.reduce((count,draft)=>count+draft.resources.length,0)} 个资源。提交后可在「成品库」中查看和编辑。</p><ul class="output-confirm-list">${drafts.map(draft=>`<li><b>${escapeHtml(draft.name)}</b><span>${draft.resources.length} 个资源</span></li>`).join('')}</ul><div class="composition-footer"><button type="button" data-output-cancel>取消</button><button type="button" data-confirm-generate>确认输出</button></div>`);
    submitting=true;let committing=false;
    dialog.querySelector('[data-output-cancel]').onclick=()=>dialog.close();
    dialog.addEventListener('cancel',event=>{if(committing)event.preventDefault()});
    dialog.addEventListener('close',()=>{submitting=false},{once:true});
    dialog.querySelector('[data-confirm-generate]').onclick=async()=>{
      if(committing)return;committing=true;
      dialog.querySelectorAll('button').forEach(button=>button.disabled=true);
      const commit=()=>{
        if(session()!==origin||activeTask()!==task||JSON.stringify(task.outputDrafts)!==signature)throw Error('任务或账号已变更，请重新打开成品组装');
        const context=taskContextByTask(task);return commitRunComposition(context.project,context.work,validateDrafts(task),task);
      };
      try{
        const result=navigator.locks?await navigator.locks.request('orchestra-production-composition',commit):commit();
        stopAudio();dialog.close();renderFinishedLibrary();renderProjectDetail();setTaskStatusFilter('finished');selectedTaskId=task.id;renderTaskCenter();
        showToast(result.alreadyCommitted?'该任务已输出，请查看已有成品':`已输出 ${result.works.length} 个成品，可在「成品库」中查看`);
      }catch(error){committing=false;dialog.close();showError(error.message==='Invalid or duplicate resources'?'请检查成品名称和资源选择':error.message==='Resource already used'?'资源已被其他成品使用，请重新选择':'输出失败：'+error.message)}
    };
  }
  function autoName(draft,resources){
    if(draft.nameManual)return;
    const first=resources.find(resource=>resource.id===draft.resourceIds[0]);
    draft.name=first?Array.from(title(first)).slice(0,50).join(''):'';
  }
  function addResource(task,id,index,type){
    const resources=resourcesFor(task),resource=resources.find(item=>item.id===id),drafts=draftsFor(task),draft=drafts[index];
    if(!resource){showError('资源已失效，请刷新后重试');return false}
    if(type&&resourceType(resource)!==type){showError('请将资源拖入对应类型的区域');return false}
    if(drafts.some(item=>item.resourceIds.includes(id))){showError('该资源已添加至成品，请先移除再添加');return false}
    if(!draft)return false;
    if(draft.resourceIds.length>=10){showError('每个成品最多添加 10 个资源');return false}
    draft.resourceIds.push(id);autoName(draft,resources);
    const state=editorState(task);state.active=index;state.collapsed.delete(index);return true;
  }
  function setResourceType(task,type,focus=false){
    if(!resourceTypes.some(([key])=>key===type))return;
    editorState(task).type=type;refreshSourcePanel(task);
    const list=taskDetailPanel.querySelector('.output-source-groups');if(list)list.scrollTop=0;
    if(focus)taskDetailPanel.querySelector(`[data-output-type="${type}"]`)?.focus?.({preventScroll:true});
  }
  taskDetailPanel.addEventListener('focusin',event=>{
    const input=event.target.closest('[data-output-name]'),task=activeTask();if(task&&input)selectWork(task,Number(input.dataset.outputName));
  });
  taskDetailPanel.addEventListener('input',event=>{
    if(!event.target.matches('[data-output-name]'))return;
    const task=activeTask();if(!task)return;
    const index=Number(event.target.dataset.outputName),draft=draftsFor(task)[index];if(!draft)return;
    if(event.isComposing)return;
    draft.name=Array.from(event.target.value).slice(0,50).join('');draft.nameManual=true;
    if(event.target.value!==draft.name)event.target.value=draft.name;
    selectWork(task,index);
    const counter=taskDetailPanel.querySelector(`[data-output-name-count="${index}"]`);if(counter)counter.textContent=`${Array.from(draft.name).length} / 50`;
    event.target.setCustomValidity?.('');syncSubmitState(task);saveDraft(task,false);
  });
  taskDetailPanel.addEventListener('compositionend',event=>{
    if(event.target.matches('[data-output-name]'))event.target.dispatchEvent(new Event('input',{bubbles:true}));
  });
  taskDetailPanel.addEventListener('keydown',event=>{
    const tab=event.target.closest('[data-output-type]'),task=activeTask();if(!tab||!task)return;
    const index=resourceTypes.findIndex(([type])=>type===tab.dataset.outputType);
    const target=event.key==='Home'?0:event.key==='End'?2:event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:-1;
    if(target!==-1){event.preventDefault();setResourceType(task,resourceTypes[target][0],true)}
  });
  taskDetailPanel.addEventListener('click',event=>{
    if(event.target.closest('[data-output-view-finished]')){switchPage('finished');renderFinishedLibrary();return}
    const task=activeTask();if(!task)return;
    const button=event.target.closest('button'),card=event.target.closest('[data-output-work]');
    if(button?.disabled)return;
    if(card&&!button?.hasAttribute('data-output-remove-work')&&!button?.hasAttribute('data-output-collapse-work'))selectWork(task,Number(card.dataset.outputWork));
    if(!button)return;
    if(button.hasAttribute('data-output-submit')){requestSubmit(task);return}
    const drafts=draftsFor(task),state=editorState(task),resources=resourcesFor(task),used=new Set(drafts.flatMap(draft=>draft.resourceIds));let changed=false;
    if(button.hasAttribute('data-output-type')){setResourceType(task,button.dataset.outputType,true);return}
    if(button.hasAttribute('data-output-visibility')){state.hideAdded=button.dataset.outputVisibility==='available';refreshSourcePanel(task);taskDetailPanel.querySelector(`[data-output-visibility="${button.dataset.outputVisibility}"]`)?.focus?.({preventScroll:true});return}
    if(button.hasAttribute('data-output-open-type')){
      selectWork(task,Number(button.dataset.outputTargetWork));setResourceType(task,button.dataset.outputOpenType,true);
      taskDetailPanel.querySelector('.output-source-panel [data-output-pick-resource]:not(:disabled)')?.focus?.({preventScroll:true});return;
    }
    if(button.hasAttribute('data-output-select-work')){
      const index=Number(button.dataset.outputSelectWork);selectWork(task,index);
      if(state.collapsed.delete(index))renderTaskCenter();return;
    }
    if(button.hasAttribute('data-output-collapse-work')){
      const index=Number(button.dataset.outputCollapseWork);if(!drafts[index])return;
      if(state.collapsed.has(index))state.collapsed.delete(index);else state.collapsed.add(index);
      renderTaskCenter();taskDetailPanel.querySelector(`[data-output-collapse-work="${index}"]`)?.focus?.({preventScroll:true});return;
    }
    if(button.hasAttribute('data-output-preview')){openResourcePreview(task,button.dataset.outputPreview);return}
    if(button.hasAttribute('data-output-add-work')&&used.size<resources.length){drafts.push({name:'',nameManual:false,resourceIds:[]});state.active=drafts.length-1;changed=true}
    if(button.hasAttribute('data-output-remove-work')&&drafts.length>1){
      const index=Number(button.dataset.outputRemoveWork);if(!drafts[index])return;
      drafts.splice(index,1);state.active=Math.max(0,Math.min(state.active-(index<state.active?1:0),drafts.length-1));
      state.collapsed=new Set([...state.collapsed].filter(i=>i!==index).map(i=>i>index?i-1:i));changed=true;
    }
    if(button.hasAttribute('data-output-pick-resource'))changed=addResource(task,button.dataset.outputPickResource,state.active);
    if(button.hasAttribute('data-output-remove-resource')){
      const [work,slot]=button.dataset.outputRemoveResource.split(':').map(Number),draft=drafts[work];
      if(!draft||slot<0||slot>=draft.resourceIds.length)return;
      state.active=work;draft.resourceIds.splice(slot,1);autoName(draft,resources);changed=true;
    }
    if(changed){
      saveDraft(task);
      let focus;
      if(button.hasAttribute('data-output-add-work'))focus=taskDetailPanel.querySelector(`[data-output-name="${state.active}"]`);
      else if(button.hasAttribute('data-output-pick-resource'))focus=taskDetailPanel.querySelector('.output-source-panel [data-output-pick-resource]:not(:disabled)');
      focus||=taskDetailPanel.querySelector(`[data-output-select-work="${state.active}"]`);focus?.focus?.({preventScroll:true});
      if(button.hasAttribute('data-output-add-work'))taskDetailPanel.querySelector(`[data-output-work="${state.active}"]`)?.scrollIntoView?.({block:'nearest'});
    }
  });
  let dragResource=null;
  const dragMime='application/x-orchestra-assembly-resource';
  function clearDropHighlight(){taskDetailPanel.querySelectorAll('.output-drop-area.is-drag-over').forEach(area=>area.classList.remove('is-drag-over'))}
  taskDetailPanel.addEventListener('dragstart',event=>{
    const source=event.target.closest('[data-output-drag-resource]'),task=activeTask();
    if(!source||!task||source.getAttribute('draggable')!=='true'||!event.dataTransfer){event.preventDefault();return}
    const id=source.dataset.outputDragResource;
    dragResource={id,taskId:task.id,session:session()};event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData(dragMime,id);
  });
  taskDetailPanel.addEventListener('dragover',event=>{
    const area=event.target.closest('[data-output-drop-work]'),task=activeTask();
    if(!area||!task||dragResource?.taskId!==task.id||dragResource.session!==session())return;
    event.preventDefault();
    const resource=resourcesFor(task).find(item=>item.id===dragResource.id),matches=resource&&resourceType(resource)===area.dataset.outputDropType;
    if(event.dataTransfer)event.dataTransfer.dropEffect=matches?'copy':'none';
    clearDropHighlight();if(matches)area.classList.add('is-drag-over');
  });
  taskDetailPanel.addEventListener('dragleave',event=>{
    const area=event.target.closest('[data-output-drop-work]');if(area&&!area.contains(event.relatedTarget))area.classList.remove('is-drag-over');
  });
  taskDetailPanel.addEventListener('drop',event=>{
    const area=event.target.closest('[data-output-drop-work]'),task=activeTask();clearDropHighlight();
    if(!area||!task||!dragResource)return;
    event.preventDefault();
    const drag=dragResource;dragResource=null;
    if(drag.taskId!==task.id||drag.session!==session()||event.dataTransfer?.getData(dragMime)!==drag.id)return;
    if(addResource(task,drag.id,Number(area.dataset.outputDropWork),area.dataset.outputDropType))saveDraft(task);
  });
  taskDetailPanel.addEventListener('dragend',()=>{dragResource=null;clearDropHighlight()});
  taskDetailPanel.addEventListener('play',event=>{
    if(event.target.closest('.work-output-workbench'))taskDetailPanel.querySelectorAll('audio').forEach(audio=>{if(audio!==event.target)audio.pause()});
  },true);
  function initialize(){
    const project=projectData.find(item=>item.id==='orchestra-theme-album'),member=project&&projectAssignableMembers(project)[0];if(!member)return;
    const resetDemo=!initialized,previousSerial=project.runs.find(item=>item.id===runId)?.serial;
    if(resetDemo){
      // Reset only this repeatable example once per page load, including its submission lock.
      project.runs=project.runs.filter(item=>item.id!==runId);
      project.batches=project.batches.filter(item=>item.id!==planId);
      project.works=(project.works||[]).filter(item=>item.runId!==runId);
      project.metricTasks=(project.metricTasks||[]).filter(item=>item.runId!==runId);
      project.calls=(project.calls||[]).filter(item=>item.runId!==runId&&(!previousSerial||item.runId!==previousSerial));
      productionTasks=productionTasks.filter(task=>task.projectId!==project.id||String(task.workId)!==runId);
    }
    let run=project.runs.find(item=>item.id===runId);
    if(!project.batches.some(plan=>plan.id===planId))project.batches.push({id:planId,name:'成品组装示例计划',quantity:1,workflowId:'work-output-production',workflowName:'词曲与成品组装流程',workflowVersion:'V1.0',delivery:'2026-10-31',notes:'将工作流的输出与备选资源组合为成品。'});
    const plan=project.batches.find(item=>item.id===planId);
    if(plan.name==='作品输出示例计划')plan.name='成品组装示例计划';
    if(plan.workflowName==='词曲与作品输出流程')plan.workflowName='词曲与成品组装流程';
    const now=Date.now();
    if(!run){
      run={id:runId,serial:previousSerial||reserveDailyProductionNumbers({flow:1})?.flow[0]||runId,name:'成品组装示例',planId,planName:'成品组装示例计划',status:'进行中',stage:'成品组装',workOutputDemo:true,owner:member.name,lastAssigneeId:member.id,createdAt:new Date(now).toISOString(),startedAt:new Date(now-20*60000).toISOString(),resources:[]};
      const base={runId,planId,version:'V1'};
      run.resources=[
        {...base,id:runId+'-lyrics-a',kind:'歌词',title:'清晨的来信',node:'基于参考生成歌词',selectionState:'selected',content:window.orchestraReferenceSongTask?.lyrics||'清晨的风推开窗\n把昨日心事轻轻放\n沿着光亮去远方\n每一步都有回响'},
        {...base,id:runId+'-audio-a',kind:'音频',title:'沿光前行',node:'基于参考曲生成歌曲',selectionState:'selected',url:'./assets/reference-song-result-a.wav'},
        {...base,id:runId+'-cover',kind:'图片',title:'晨曦映像',node:'封面资源',selectionState:'selected',url:'./assets/work-output-demo-cover.svg'},
        {...base,id:runId+'-lyrics-b',kind:'歌词',title:'未说完的话',node:'基于参考生成歌词',selectionState:'backup',version:'V2',content:'当第一束光落在肩上\n我听见远方轻轻歌唱\n那些没有说完的话\n都开成了清晨的花'},
        {...base,id:runId+'-audio-b',kind:'音频',title:'微风里的回响',node:'基于参考曲生成歌曲',selectionState:'backup',version:'V2',url:'./assets/reference-song-result-b.wav'}
      ];
      project.runs.push(run);
    }
    if(run.name==='作品输出示例')run.name='成品组装示例';
    if(run.planName==='作品输出示例计划')run.planName=plan.name;
    if(run.stage==='作品输出')run.stage='成品组装';
    const migrateTaskLabels=task=>{
      if(task.nodeType==='workOutput')task.nodeTitle='成品组装';
      if(task.workName==='作品输出示例')task.workName=run.name;
      if(task.planName==='作品输出示例计划')task.planName=plan.name;
      if(task.workflowName==='词曲与作品输出流程')task.workflowName=plan.workflowName;
    };
    productionTasks.filter(task=>task.projectId===project.id&&task.workId===runId).forEach(migrateTaskLabels);
    if(run.workOutputCompletedTask)migrateTaskLabels(run.workOutputCompletedTask);
    const context=resolveTaskWorkflowContext(project,run);if(!context)return;
    run.nodeAssignments||={};
    context.snapshot.nodes.forEach(node=>{run.nodeAssignments[projectWorkAssignmentKey(context,node.id)]||={workflowId:context.plan.workflowId,workflowVersion:context.plan.workflowVersion,nodeId:node.id,nodeName:node.title,memberId:member.id,memberName:member.name,assignedAt:now}});
    Object.values(run.nodeAssignments).forEach(assignment=>{if(assignment.nodeName==='作品输出')assignment.nodeName='成品组装'});
    if(!productionTasks.some(task=>task.projectId===project.id&&task.workId===runId)){
      context.snapshot.nodes.forEach((node,index)=>{
        const task=createProductionTask(context,node,index,index===context.snapshot.nodes.length-1&&!modelDone(run)?'in_progress':'completed',now-1000+index);
        Object.assign(task,{assignmentCreated:true,updatedLabel:'刚刚'});
        if(task.status==='completed'){task.completedAt=run.completedAt||new Date(now-1000+index).toISOString();task.actualSubmitter=member.name;if(['lyricsReview','songReview'].includes(node.type))task.reviewResult='approved'}
        if(['refLyrics','refSong'].includes(node.type)){
          const source=run.resources.find(resource=>resource.selectionState==='selected'&&kind(resource)===(node.type==='refLyrics'?'歌词':'音频'));
          if(source){
            task.generationStage='generated';task.selectedCandidateId=source.id;
            task.candidates=[{id:source.id,title:source.title,...(node.type==='refLyrics'?{content:source.content}:{url:source.url,durationSeconds:24})}];
            task.selectedOutput=node.type==='refLyrics'?{type:'lyrics',candidateId:source.id,content:source.content}:{type:'song',candidateId:source.id,title:source.title,url:source.url};
            if(node.type==='refLyrics')task.selectedCandidateText=source.content;
            else task.referenceSongDemo=true;
          }
        }
        if(node.type==='workOutput'){task.updatedAt=now+10;if(run.workOutputCompletedTask)Object.assign(task,run.workOutputCompletedTask)}
        productionTasks.push(task);
      });
    }
    if(run.workOutputCompletedTask){
      const task=productionTasks.find(item=>item.id===run.workOutputCompletedTask.id);
      if(task)Object.assign(task,run.workOutputCompletedTask);else productionTasks.push(clone(run.workOutputCompletedTask));
    }
    initialized=true;
    syncProjectPlanProductionProgress(project);persistProductionTasks();persistProjectWorkAssignments();modelPersist();renderTaskCenter();
    if(resetDemo){renderFinishedLibrary();renderProjectDetail()}
  }
  window.orchestraWorkOutputTask={render,stopAudio,validateDrafts,requestSubmit,initialize};
  window.addEventListener('pagehide',()=>{stopAudio();closePreviews()});
  if(document.readyState==='complete')initialize();else window.addEventListener('load',initialize,{once:true});
})();
