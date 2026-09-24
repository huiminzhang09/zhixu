/* One successful composition batch per run; works and lock share one storage commit. */
const compositionNotice='每行生成一个作品，提交后该流水不可再次组合，请一次完成全部配置。';
function compositionWorks(project,run){return (project.works||[]).filter(w=>w.runId===run.id)}
function compositionLocked(project,run){return Boolean(run.composition?.committedAt||compositionWorks(project,run).length)}
function compositionResourceName(resource,index=0){return `${resource.title||`${resource.kind} ${index+1}`} · ${resource.version||'V1'}`}
function compositionReadOnly(project,run){
 const works=compositionWorks(project,run);
 const resourceNames=(work,kind)=>work.resources.filter(r=>r.kind===kind).map((r,i)=>escapeHtml(compositionResourceName(r,i))).join('<br>')||'—';
 const d=modelDialog('已生成作品',`<p>流水 ${escapeHtml(run.serial)} · 已生成 ${works.length} 个作品</p><p class="model-note">该流水已完成组合，不可再次组合。以下为已生成作品及其关联资源。</p>${modelTable(['作品名称','歌词','音频'],works.map(w=>[escapeHtml(w.name),resourceNames(w,'歌词'),resourceNames(w,'音频')]))}<div class="composition-footer"><button type="button" data-readonly-close>关闭</button></div>`);
 d.querySelector('[data-readonly-close]').onclick=()=>d.close();return d;
}
function showResources(project,run){if(!run||!modelDone(run))return;return showComposer(project,run.id)}
function showComposer(project,runId=''){
 if(!runId){
  const available=(project.runs||[]).filter(r=>modelDone(r)&&!compositionLocked(project,r)&&(formalPlanFilter==='all'||r.planId===formalPlanFilter));
  const d=modelDialog('选择生产流水',`<p>请选择一条已完成且尚未组合的流水。</p><label>来源流水 <select id="compositionRun"><option value="">请选择流水</option>${available.map(r=>`<option value="${escapeHtml(r.id)}">${escapeHtml(r.serial)} · ${escapeHtml(r.planName||'')}</option>`).join('')}</select></label>${available.length?'':'<p>暂无可组合的已完成流水。</p>'}<div class="composition-footer"><button type="button" data-run-cancel>取消</button><button type="button" data-run-next disabled>下一步</button></div>`);
  d.querySelector('#compositionRun').onchange=e=>d.querySelector('[data-run-next]').disabled=!e.target.value;
  d.querySelector('[data-run-cancel]').onclick=()=>d.close();
  d.querySelector('[data-run-next]').onclick=()=>{const id=d.querySelector('select').value;if(id){d.close();showComposer(project,id)}};return d;
 }
 const run=(project.runs||[]).find(r=>r.id===runId);if(!run||!modelDone(run))return;
 if(compositionLocked(project,run))return compositionReadOnly(project,run);
 const resources=modelResources(project,run),lyrics=resources.filter(r=>r.kind==='歌词'),audio=resources.filter(r=>r.kind==='音频'),hasResources=lyrics.length>0&&audio.length>0;
 const options=(items,placeholder)=>`<option value="">${placeholder}</option>`+items.map((r,i)=>`<option value="${escapeHtml(r.id)}">${escapeHtml(compositionResourceName(r,i))}</option>`).join('');
 const d=modelDialog('组合作品',`<p>来源流水：${escapeHtml(run.serial)}</p><p class="model-note">${compositionNotice}</p><form id="compositionForm" novalidate><div class="model-table-scroll"><table class="model-table composition-table"><thead><tr><th>作品名称</th><th>歌词</th><th>音频</th><th>操作</th></tr></thead><tbody id="compositionRows"></tbody></table></div><button type="button" id="addComposition" ${hasResources?'':'disabled'}>＋添加作品</button>${hasResources?'':'<p class="composition-empty">暂无可组合的歌词或音频。</p>'}<p id="compositionError" role="alert"></p><div class="composition-footer"><button type="button" data-composition-cancel>取消</button><button type="submit" id="confirmComposition" ${hasResources?'':'disabled'}>确认生成</button></div></form>`);
 const form=d.querySelector('form'),rows=d.querySelector('#compositionRows'),error=d.querySelector('#compositionError'),submit=d.querySelector('#confirmComposition');let pending=false;
 const syncRows=()=>rows.querySelectorAll('tr').forEach((row,i)=>{row.querySelector('[data-delete-row]').disabled=rows.children.length===1;row.querySelector('[name="name"]').setAttribute('aria-label',`第${i+1}行作品名称`);row.querySelector('[name="lyrics"]').setAttribute('aria-label',`第${i+1}行歌词`);row.querySelector('[name="audio"]').setAttribute('aria-label',`第${i+1}行音频`)});
 function add(){const row=document.createElement('tr');row.innerHTML=`<td><input name="name" maxlength="70" required placeholder="请输入作品名称"></td><td><select name="lyrics" required>${options(lyrics,'请选择歌词')}</select></td><td><select name="audio" required>${options(audio,'请选择音频')}</select></td><td><button type="button" data-delete-row>删除</button></td>`;rows.append(row);row.querySelector('[data-delete-row]').onclick=()=>{if(rows.children.length>1){row.remove();syncRows();error.textContent=''}};syncRows()}
 add();d.querySelector('#addComposition').onclick=()=>add();d.querySelector('[data-composition-cancel]').onclick=()=>d.close();
 form.addEventListener('input',()=>error.textContent='');form.addEventListener('change',()=>error.textContent='');
 form.onsubmit=e=>{
  e.preventDefault();if(pending||!hasResources)return;
  if(compositionLocked(project,run)){d.close();compositionReadOnly(project,run);return}
  const drafts=[];error.textContent='';
  const invalid=(message,control)=>{error.textContent=message;control.focus()};
  for(const [i,row] of Array.from(rows.children).entries()){
   const input=row.querySelector('[name="name"]'),lyric=row.querySelector('[name="lyrics"]'),song=row.querySelector('[name="audio"]'),name=input.value.trim();
   if(!name)return invalid(`请填写第${i+1}行的作品名称。`,input);
   if(Array.from(name).length>70)return invalid(`第${i+1}行的作品名称最多七十个字符。`,input);
   const l=lyrics.find(r=>r.id===lyric.value),a=audio.find(r=>r.id===song.value);
   if(!l)return invalid(`请选择第${i+1}行的歌词。`,lyric);
   if(!a)return invalid(`请选择第${i+1}行的音频。`,song);
   drafts.push({name,resources:modelClone([{...l,title:l.title||`歌词 ${lyrics.indexOf(l)+1}`},{...a,title:a.title||`音频 ${audio.indexOf(a)+1}`}])});
  }
  pending=true;submit.disabled=true;
  const confirmation=modelDialog('确认生成作品',`<p>本次将生成${drafts.length}个作品，提交后该流水不可再次组合，未使用的资源也无法再通过该流水组合作品。确认生成吗？</p><div class="composition-footer"><button type="button" data-confirm-cancel>取消</button><button type="button" data-confirm-generate>确认生成</button></div>`);
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
 const now=new Date().toISOString(),batchId=crypto.randomUUID();
 const works=drafts.map((draft,index)=>({id:`WORK-${batchId}-${index+1}`,name:draft.name,resources:modelClone(draft.resources),planId:run.planId,runId:run.id,projectId:project.id,creator:'Huimin Zhang',createdAt:now,compositionBatchId:batchId}));
 const snapshot=modelClone(projectData),target=snapshot.find(p=>p.id===project.id),targetRun=target.runs.find(r=>r.id===run.id);
 const existing=new Map((target.works||[]).map(w=>[w.id,w]));(persisted?.works||[]).forEach(w=>existing.set(w.id,w));works.forEach(w=>existing.set(w.id,w));target.works=[...existing.values()];
 targetRun.composition={batchId,committedAt:now,workIds:works.map(w=>w.id)};
 localStorage.setItem(productionModelKey,JSON.stringify(snapshot));
 project.works=target.works;run.composition=targetRun.composition;
 return {alreadyCommitted:false,works};
}
// Three sample runs: assignment only, ready to compose, and already composed.
{
 const project=projectData.find(p=>p.id==='orchestra-theme-album');
 if(project&&project.demoScenarioVersion!==3){
  const planId='DEMO-THREE-STATES',planName='三种运行状态示例',now=new Date().toISOString();
  const source=project.runs.find(r=>r.resources?.some(x=>x.kind==='歌词')&&r.resources?.some(x=>x.kind==='音频'));
  const resourceTemplates=source?.resources||[];
  project.batches=[{id:planId,name:planName,quantity:3,workflowId:'reference-production',workflowName:'参考词曲完整流程',workflowVersion:'V1.0',delivery:'2026-09-30',notes:'001 进行中，仅分配人员；002 已完成，可组合作品；003 已完成，已组合，仅查看。'}];
  project.runs=[1,2,3].map(index=>{
   const id=`DEMO-STATE-00${index}`;
   return {id,serial:id,name:['进行中 · 分配人员','已完成 · 可组合作品','已完成 · 已组合作品'][index-1],planId,planName,status:index===1?'进行中':'已完成',stage:index===1?'等待人员分配':'已完成',owner:'未分配',createdAt:now,startedAt:index===1?null:now,completedAt:index===1?null:now,resources:index===1?[]:resourceTemplates.map((r,i)=>({...modelClone(r),id:`${id}-RESOURCE-${i+1}`,runId:id,planId}))};
  });
  const completed=project.runs[2],lyrics=completed.resources.find(r=>r.kind==='歌词'),audio=completed.resources.find(r=>r.kind==='音频');
  project.works=[{id:'DEMO-CONFIRMED-WORK',name:'晚风与星光',planId,runId:completed.id,projectId:project.id,resources:modelClone([lyrics,audio].filter(Boolean)),creator:'张三',createdAt:now,compositionBatchId:'DEMO-CONFIRMED-BATCH'}];
  completed.composition={batchId:'DEMO-CONFIRMED-BATCH',committedAt:now,workIds:['DEMO-CONFIRMED-WORK']};
  project.calls=[];project.metricTasks=[];project.demoScenarioVersion=3;
  productionTasks=productionTasks.filter(t=>t.projectId!==project.id);
  persistProductionTasks();syncProjectPlanProductionProgress(project);modelPersist();
 }
}

// Display FLOW numbers while preserving existing internal foreign keys and composition history.
{
 const missing=projectData.flatMap(p=>(p.runs||[])).filter(r=>!/^FLOW\d{13}$/.test(r.serial||''));
 if(missing.length){const numbers=reserveDailyProductionNumbers({flow:missing.length});if(numbers){missing.forEach((run,index)=>run.serial=numbers.flow[index]);modelPersist()}}
}
