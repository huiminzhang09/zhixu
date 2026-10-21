/* A normal run is locked after one composition; the fourth demo run exposes only unused resources. */
const compositionNotice='每行生成一个作品，提交后该流水不可再次组合，请一次完成全部配置。';
function compositionWorks(project,run){return (project.works||[]).filter(w=>w.runId===run.id)}
function compositionUsedResourceIds(project,run){return new Set(compositionWorks(project,run).flatMap(work=>(work.resources||[]).map(resource=>resource.id)).filter(Boolean))}
function compositionAvailableResources(project,run){const used=compositionUsedResourceIds(project,run);return modelResources(project,run).filter(resource=>!used.has(resource.id))}
function compositionHasPair(project,run){const available=compositionAvailableResources(project,run);return available.length>0}
function compositionLocked(project,run){const committed=Boolean(run.composition?.committedAt||compositionWorks(project,run).length);return committed&&!(run.demoAllowRemainingComposition&&compositionHasPair(project,run))}
function compositionResourceName(resource,index=0){return `${resource.title||`${resource.kind} ${index+1}`} · ${resource.version||'V1'}`}
function compositionReadOnly(project,run){
 const works=compositionWorks(project,run);
 const resourceNames=work=>work.resources.map((r,i)=>`<div class="composition-selected-resource">${escapeHtml(compositionResourceName(r,i))}${r.kind==='歌词'?`<details class="composition-lyrics"><summary>查看歌词</summary><pre>${escapeHtml(r.content||'暂无歌词内容')}</pre></details>`:r.kind==='音频'&&r.url?`<audio controls preload="metadata" src="${escapeHtml(r.url)}"></audio>`:''}</div>`).join('')||'—';
 const d=modelDialog('已生成作品',`<p>流水 ${escapeHtml(run.serial)} · 已生成 ${works.length} 个作品</p><p class="model-note">该流水当前不可再次组合。以下为已生成作品及其关联资源。</p>${modelTable(['作品名称','已选资源'],works.map(w=>[escapeHtml(w.name),resourceNames(w)]))}<div class="composition-footer"><button type="button" data-readonly-close>关闭</button></div>`);
 d.querySelector('[data-readonly-close]').onclick=()=>d.close();return d;
}
function showResources(project,run){if(!run||!modelDone(run))return;return showComposer(project,run.id)}
function showComposer(project,runId=''){
 if(!runId){
  const available=(project.runs||[]).filter(r=>modelDone(r)&&!compositionLocked(project,r)&&(formalPlanFilter==='all'||r.planId===formalPlanFilter));
  const d=modelDialog('选择生产流水',`<p>请选择一条有可组合资源的已完成流水。</p><label>来源流水 <select id="compositionRun"><option value="">请选择流水</option>${available.map(r=>`<option value="${escapeHtml(r.id)}">${escapeHtml(r.serial)} · ${escapeHtml(r.planName||'')}</option>`).join('')}</select></label>${available.length?'':'<p>暂无可组合的已完成流水。</p>'}<div class="composition-footer"><button type="button" data-run-cancel>取消</button><button type="button" data-run-next disabled>下一步</button></div>`);
  d.querySelector('#compositionRun').onchange=e=>d.querySelector('[data-run-next]').disabled=!e.target.value;
  d.querySelector('[data-run-cancel]').onclick=()=>d.close();
  d.querySelector('[data-run-next]').onclick=()=>{const id=d.querySelector('select').value;if(id){d.close();showComposer(project,id)}};return d;
 }
 const run=(project.runs||[]).find(r=>r.id===runId);if(!run||!modelDone(run))return;
 if(compositionLocked(project,run))return compositionReadOnly(project,run);
 const resources=compositionAvailableResources(project,run),hasResources=resources.length>0,hasPriorWorks=compositionWorks(project,run).length>0;
 const d=modelDialog('组合作品',`<p>来源流水：${escapeHtml(run.serial)}</p><p class="model-note">每个作品可选择一至十个资源，不限制资源类型；已选资源不能重复用于其他作品。${hasPriorWorks?'已使用的资源不再提供选择。':compositionNotice}</p><form id="compositionForm" novalidate><div id="compositionRows" class="composition-work-cards"></div><button type="button" id="addComposition" ${hasResources?'':'disabled'}>＋新增作品</button>${hasResources?'':'<p class="composition-empty">暂无可组合的资源。</p>'}<p id="compositionError" role="alert"></p><div class="composition-footer"><button type="button" data-composition-cancel>取消</button><button type="submit" id="confirmComposition" ${hasResources?'':'disabled'}>确认生成</button></div></form>`);
 const form=d.querySelector('form'),rows=d.querySelector('#compositionRows'),error=d.querySelector('#compositionError'),submit=d.querySelector('#confirmComposition');let pending=false;
 const selectedIds=()=>new Set([...rows.querySelectorAll('[name="resource"]')].map(select=>select.value).filter(Boolean));
 function syncRows(){
  const used=selectedIds();
  rows.querySelectorAll('[name="resource"]').forEach(select=>{
   const value=select.value;select.innerHTML='<option value="">请选择资源</option>'+resources.map((r,i)=>`<option value="${escapeHtml(r.id)}" ${used.has(r.id)&&r.id!==value?'disabled':''}>${escapeHtml(compositionResourceName(r,i))}${used.has(r.id)&&r.id!==value?'（已选择）':''}</option>`).join('');select.value=value;
  });
  [...rows.children].forEach((row,i)=>{
   row.querySelector('[data-work-heading]').textContent=`作品 ${i+1}`;row.querySelector('[name="name"]').setAttribute('aria-label',`作品 ${i+1} 名称`);
   row.querySelector('[data-delete-row]').disabled=rows.children.length===1;
   const count=row.querySelectorAll('[name="resource"]').length;row.querySelector('[data-resource-count]').textContent=`${count} / 10 个资源`;
   row.querySelector('[data-add-resource]').disabled=count>=10||used.size>=resources.length;
   row.querySelectorAll('[data-remove-resource]').forEach(button=>button.disabled=count===1);
  });
  d.querySelector('#addComposition').disabled=!hasResources||used.size>=resources.length;
 }
 function addResource(row){
  if(row.querySelectorAll('[name="resource"]').length>=10)return;
  const item=document.createElement('div');item.className='composition-resource-item';item.innerHTML='<div class="composition-resource-choice"><select name="resource" aria-label="选择作品资源" required></select><button type="button" data-remove-resource>移除</button></div><div data-resource-preview></div>';
  row.querySelector('[data-resource-list]').append(item);
  item.querySelector('select').onchange=event=>{
   const resource=resources.find(r=>r.id===event.target.value),preview=item.querySelector('[data-resource-preview]');preview.querySelectorAll('audio').forEach(player=>player.pause());
   preview.innerHTML=resource?`<div class="composition-selected-resource"><small>${escapeHtml(compositionResourceName(resource,resources.indexOf(resource)))}</small>${resource.kind==='歌词'?`<details class="composition-lyrics"><summary>查看歌词</summary><pre>${escapeHtml(resource.content||'暂无歌词内容')}</pre></details>`:resource.kind==='音频'?(resource.url?`<audio controls preload="metadata" controlslist="nodownload" aria-label="试听 ${escapeHtml(compositionResourceName(resource))}" src="${escapeHtml(resource.url)}"></audio>`:'<small>暂无可播放音频</small>'):'<small>该资源暂不支持预览</small>'}</div>`:'';
   syncRows();
  };
  item.querySelector('[data-remove-resource]').onclick=()=>{item.querySelectorAll('audio').forEach(player=>player.pause());item.remove();syncRows()};syncRows();
 }
 function add(){
  const row=document.createElement('article');row.className='composition-work-card';row.innerHTML='<div class="composition-work-heading"><b data-work-heading></b><button type="button" data-delete-row>删除作品</button></div><label>作品名称<input name="name" maxlength="70" required placeholder="请输入作品名称"></label><div data-resource-list></div><div class="composition-resource-toolbar"><button type="button" data-add-resource>＋添加资源</button><small data-resource-count></small></div>';
  rows.append(row);addResource(row);row.querySelector('[data-add-resource]').onclick=()=>addResource(row);
  row.querySelector('[data-delete-row]').onclick=()=>{if(rows.children.length>1){row.querySelectorAll('audio').forEach(player=>player.pause());row.remove();syncRows();error.textContent=''}};syncRows();
 }
 d.addEventListener('play',event=>{if(event.target.tagName==='AUDIO')d.querySelectorAll('audio').forEach(player=>{if(player!==event.target)player.pause()})},true);

 add();d.querySelector('#addComposition').onclick=()=>add();d.querySelector('[data-composition-cancel]').onclick=()=>d.close();
 form.addEventListener('input',()=>error.textContent='');form.addEventListener('change',()=>error.textContent='');
 form.onsubmit=e=>{
  e.preventDefault();if(pending||!hasResources)return;
  if(compositionLocked(project,run)){d.close();compositionReadOnly(project,run);return}
  const drafts=[];error.textContent='';
  const invalid=(message,control)=>{error.textContent=message;control.focus()};
  const used=new Set();
  for(const [i,row] of Array.from(rows.children).entries()){
   const input=row.querySelector('[name="name"]'),name=input.value.trim(),selects=[...row.querySelectorAll('[name="resource"]')];
   if(!name)return invalid(`请填写第${i+1}个作品的名称。`,input);
   if(Array.from(name).length>70)return invalid(`第${i+1}个作品名称最多七十个字符。`,input);
   if(selects.length<1||selects.length>10)return invalid('每个作品需选择一至十个资源。',input);
   const chosen=[];
   for(const [j,select] of selects.entries()){
    const resource=resources.find(r=>r.id===select.value);
    if(!resource)return invalid(`请选择第${i+1}个作品的第${j+1}个资源。`,select);
    if(used.has(resource.id))return invalid('同一资源不可重复选择。',select);
    used.add(resource.id);chosen.push({...resource,title:resource.title||compositionResourceName(resource,resources.indexOf(resource))});
   }
   drafts.push({name,resources:modelClone(chosen)});
  }
  d.querySelectorAll('audio').forEach(player=>player.pause());pending=true;submit.disabled=true;
  const confirmation=modelDialog('确认生成作品',`<p>${hasPriorWorks?`本次将生成${drafts.length}个作品，已选资源将被使用，未使用的资源仍可继续组合作品。确认生成吗？`:`本次将生成${drafts.length}个作品，提交后该流水不可再次组合，未使用的资源也无法再通过该流水组合作品。确认生成吗？`}</p><div class="composition-footer"><button type="button" data-confirm-cancel>取消</button><button type="button" data-confirm-generate>确认生成</button></div>`);
  let committing=false;confirmation.addEventListener('cancel',event=>{if(committing)event.preventDefault()});
  confirmation.querySelector('[data-confirm-cancel]').onclick=()=>confirmation.close();
  confirmation.addEventListener('close',()=>{if(!committing){pending=false;submit.disabled=false}});
  confirmation.querySelector('[data-confirm-generate]').onclick=async()=>{
   if(committing)return;committing=true;confirmation.querySelector('[data-confirm-generate]').disabled=true;confirmation.querySelector('[data-confirm-cancel]').disabled=true;
   try{
    const commit=()=>commitRunComposition(project,run,drafts);
    const result=navigator.locks?await navigator.locks.request('orchestra-production-composition',commit):commit();
    confirmation.close();d.close();renderProjectDetail();if(typeof renderFinishedLibrary==='function')renderFinishedLibrary();
    if(result.alreadyCommitted)compositionReadOnly(project,run);else showToast(`已生成${drafts.length}个作品。`);
   }catch{
    committing=false;confirmation.close();pending=false;submit.disabled=false;error.textContent='生成失败，请重试。';
   }
  };
 };
 return d;
}
function commitRunComposition(project,run,drafts){
 // Local prototype transaction: one synchronous storage write saves every work and the lock.
 // A production service must provide the same atomic commit with runId as an idempotency key.
 const raw=localStorage.getItem(productionModelKey),saved=raw?JSON.parse(raw):null;
 const persisted=Array.isArray(saved)?saved.find(p=>p.id===project.id):null,persistedRun=persisted?.runs?.find(r=>r.id===run.id);
 if(compositionLocked(project,run)||(persistedRun&&compositionLocked(persisted,persistedRun))){
  if(persistedRun){run.composition=persistedRun.composition;const known=new Map((project.works||[]).map(w=>[w.id,w]));(persisted.works||[]).forEach(w=>known.set(w.id,w));project.works=[...known.values()]}
  return {alreadyCommitted:true};
 }
 if(!modelDone(run)||!drafts.length)throw Error('Invalid composition');
 const draftResources=drafts.flatMap(draft=>draft.resources||[]);
 if(drafts.some(draft=>!draft.name?.trim()||Array.from(draft.name.trim()).length>70||!draft.resources?.length||draft.resources.length>10)||new Set(draftResources.map(r=>r.id)).size!==draftResources.length)throw Error('Invalid or duplicate resources');
 const currentRun=persistedRun||run,currentProject=persisted||project,availableIds=new Set(compositionAvailableResources(currentProject,currentRun).map(resource=>resource.id));
 if(drafts.some(draft=>(draft.resources||[]).some(resource=>!availableIds.has(resource.id))))throw Error('Resource already used');
 const now=new Date().toISOString(),batchId=crypto.randomUUID();
 const works=drafts.map((draft,index)=>({id:`WORK-${batchId}-${index+1}`,name:draft.name,resources:modelClone(draft.resources),planId:run.planId,runId:run.id,projectId:project.id,creator:'Huimin Zhang',createdAt:now,compositionBatchId:batchId}));
 const snapshot=modelClone(projectData),target=snapshot.find(p=>p.id===project.id),targetRun=target.runs.find(r=>r.id===run.id);
 const existing=new Map((target.works||[]).map(w=>[w.id,w]));(persisted?.works||[]).forEach(w=>existing.set(w.id,w));works.forEach(w=>existing.set(w.id,w));target.works=[...existing.values()];
 const previousComposition=targetRun.composition||{};
 targetRun.composition={...previousComposition,batchId,committedAt:now,workIds:[...new Set([...(previousComposition.workIds||[]),...works.map(w=>w.id)])],batches:[...(previousComposition.batches||[]),{batchId,committedAt:now,workIds:works.map(w=>w.id)}]};
 localStorage.setItem(productionModelKey,JSON.stringify(snapshot));
 project.works=target.works;run.composition=targetRun.composition;
 return {alreadyCommitted:false,works};
}
// Four composition scenarios plus ten pending runs reset on page load for allocation demos.
{
 const project=projectData.find(p=>p.id==='orchestra-theme-album');
 if(project){
  const retainedFinishedEdits=(project.works||[]).filter(work=>work.finishedEditedAt).map(modelClone);
  const previousSerials=new Map((project.runs||[]).filter(run=>/^DEMO-(?:STATE-00[1-4]|ALLOCATION-\d{3})$/.test(run.id)).map(run=>[run.id,run.serial]));
  const planId='DEMO-FOUR-STATES',planName='四种资源组合状态示例',now=new Date().toISOString();
  const source=project.runs.find(r=>r.resources?.some(x=>x.kind==='歌词')&&r.resources?.some(x=>x.kind==='音频'));
  const resourceTemplates=source?.resources||[];
  const lyricsTemplates=resourceTemplates.filter(resource=>resource.kind==='歌词'),audioTemplates=resourceTemplates.filter(resource=>resource.kind==='音频');
  const resourcesFor=(id,lyricCount,audioCount)=>[
   ...lyricsTemplates.slice(0,lyricCount).map((resource,index)=>({...modelClone(resource),id:`${id}-LYRIC-${index+1}`,selectionState:index===0?'selected':'backup',runId:id,planId})),
   ...audioTemplates.slice(0,audioCount).map((resource,index)=>({...modelClone(resource),id:`${id}-AUDIO-${index+1}`,selectionState:index===0?'selected':'backup',runId:id,planId}))
  ];
  project.batches=[{id:planId,name:planName,quantity:14,workflowId:'reference-production',workflowName:'参考词曲完整流程',workflowVersion:'V1.0',delivery:'2026-09-30',notes:'001 进行中，仅分配人员；002 已完成，资源未组合；003 已组合且资源用完；004 已组合并保留可继续组合的资源；另有 10 条进行中运行用于批量分配人员。'}];
  project.runs=[1,2,3,4].map(index=>{
   const id=`DEMO-STATE-00${index}`,serial=previousSerials.get(id);
   const run={id,serial:/^FLOW\d{13}$/.test(serial||'')?serial:id,name:['进行中 · 仅分配人员','已完成 · 尚未组合','已组合 · 资源已用完','已组合 · 仍有剩余资源'][index-1],planId,planName,status:index===1?'进行中':'已完成',stage:index===1?'等待人员分配':'已完成',owner:'未分配',demoOwner:index%2?'李四':'张三',createdAt:now,startedAt:index===1?null:now,completedAt:index===1?null:now,resources:index===1?[]:resourcesFor(id,index===3?1:2,index===3?1:2)};
   if(index===4)run.demoAllowRemainingComposition=true;
   return run;
  });
  for(let index=1;index<=10;index++){
   const id=`DEMO-ALLOCATION-${String(index).padStart(3,'0')}`,serial=previousSerials.get(id);
   project.runs.push({id,serial:/^FLOW\d{13}$/.test(serial||'')?serial:id,name:`批量分配示例 ${index}`,planId,planName,status:'进行中',stage:'等待人员分配',owner:'未分配',createdAt:now,startedAt:null,completedAt:null,resources:[]});
  }
  const fullyUsed=project.runs[2],usedLyrics=fullyUsed.resources.find(r=>r.kind==='歌词'),usedAudio=fullyUsed.resources.find(r=>r.kind==='音频');
  const residual=project.runs[3],residualLyrics=residual.resources.find(r=>r.kind==='歌词'),residualAudio=residual.resources.find(r=>r.kind==='音频');
  project.works=[
   {id:'DEMO-CONFIRMED-WORK-03',name:'晚风与星光 · 资源用尽示例',planId,runId:fullyUsed.id,projectId:project.id,resources:modelClone([usedLyrics,usedAudio].filter(Boolean)),creator:'张三',createdAt:now,compositionBatchId:'DEMO-CONFIRMED-BATCH-03'},
   {id:'DEMO-CONFIRMED-WORK-04',name:'晨光与远方 · 剩余资源示例',planId,runId:residual.id,projectId:project.id,resources:modelClone([residualLyrics,residualAudio].filter(Boolean)),creator:'李四',createdAt:now,compositionBatchId:'DEMO-CONFIRMED-BATCH-04'}
  ];
  for(const edited of retainedFinishedEdits){const index=project.works.findIndex(work=>work.id===edited.id);if(index>=0)project.works[index]=edited;else project.works.push(edited)}
  fullyUsed.composition={batchId:'DEMO-CONFIRMED-BATCH-03',committedAt:now,workIds:['DEMO-CONFIRMED-WORK-03']};
  residual.composition={batchId:'DEMO-CONFIRMED-BATCH-04',committedAt:now,workIds:['DEMO-CONFIRMED-WORK-04']};
  project.calls=[];project.metricTasks=[];project.demoScenarioVersion=4;
  productionTasks=productionTasks.filter(t=>t.projectId!==project.id);
  persistProductionTasks();syncProjectPlanProductionProgress(project);modelPersist();
 }
}

// Display FLOW numbers while preserving existing internal foreign keys and composition history.
{
 const missing=projectData.flatMap(p=>(p.runs||[])).filter(r=>!/^FLOW\d{13}$/.test(r.serial||''));
 if(missing.length){const numbers=reserveDailyProductionNumbers({flow:missing.length});if(numbers){missing.forEach((run,index)=>run.serial=numbers.flow[index]);modelPersist()}}
}
