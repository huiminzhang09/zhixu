/* A final workflow task combines selected and backup resources into finished works. */
(() => {
  const runId='DEMO-WORK-OUTPUT-001',planId='DEMO-WORK-OUTPUT-PLAN';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const session=()=>JSON.stringify([localStorage.getItem('orchestra-demo-account'),localStorage.getItem('orchestra-workspace')]);
  const kind=resource=>({text:'歌词',lyrics:'歌词',audio:'音频',song:'音频',image:'图片'}[resource.type])||resource.kind;
  const title=resource=>resource.title||resource.kind||'资源';
  let mountedTask='',mountedSession='',submitting=false;
  function stopAudio(){taskDetailPanel.querySelectorAll('audio').forEach(audio=>audio.pause())}
  function resourcesFor(task){
    const context=taskContextByTask(task);if(!context)return [];
    return (context.work.resources||[]).filter(resource=>['selected','backup'].includes(resource.selectionState));
  }
  function draftsFor(task){
    if(!Array.isArray(task.outputDrafts))task.outputDrafts=[{name:'晨间来信',resourceIds:resourcesFor(task).filter(resource=>resource.selectionState==='selected').slice(0,10).map(resource=>resource.id)}];
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
  function badge(resource){return `<span class="output-resource-badge ${resource.selectionState==='backup'?'is-backup':''}">${resource.selectionState==='backup'?'备选':'输出'}</span>`}
  function validateDrafts(task,drafts=draftsFor(task)){
    const resources=new Map(resourcesFor(task).map(resource=>[resource.id,resource])),used=new Set();
    if(!drafts.length)throw Error('请至少配置一个成品');
    return drafts.map((draft,index)=>{
      const name=String(draft.name||'').trim();
      if(!name)throw Error(`请填写成品 ${index+1} 的名称`);
      if(Array.from(name).length>70)throw Error(`成品 ${index+1} 的名称最多 70 个字符`);
      if(!draft.resourceIds?.length||draft.resourceIds.length>10)throw Error(`成品 ${index+1} 需要选择 1～10 个资源`);
      const chosen=draft.resourceIds.map(id=>{
        if(!resources.has(id))throw Error(`请为成品 ${index+1} 选择有效资源`);
        if(used.has(id))throw Error('同一资源不能重复选择或用于多个成品');
        used.add(id);return resources.get(id);
      });
      return {name,resources:chosen};
    });
  }
  function workCard(draft,index,resources,used,workCount){
    return `<article class="output-work-card" data-output-work="${index}"><header><h3>成品 ${index+1}</h3><button type="button" class="output-remove" data-output-remove-work="${index}" ${workCount===1?'disabled':''}>删除成品</button></header>
      <label class="output-name-field"><span>成品名称 <em>*</em></span><input data-output-name="${index}" value="${escapeHtml(draft.name)}" maxlength="70" placeholder="请输入成品名称" required><small>最多 70 个字符</small></label>
      <div class="output-resource-heading"><b>选择资源</b><span>${draft.resourceIds.filter(Boolean).length} / 10 个</span></div>
      <div class="output-selected-resources">${draft.resourceIds.map((id,slot)=>{
        const resource=resources.find(item=>item.id===id);
        return `<div class="output-selected-resource"><div class="output-resource-choice"><select data-output-resource="${index}:${slot}" aria-label="成品 ${index+1} 的资源 ${slot+1}" required><option value="">请选择资源</option>${resources.map(item=>`<option value="${escapeHtml(item.id)}" ${item.id===id?'selected':''} ${used.has(item.id)&&item.id!==id?'disabled':''}>${escapeHtml(title(item))} · ${kind(item)} · ${item.selectionState==='backup'?'备选':'输出'}${used.has(item.id)&&item.id!==id?'（已选择）':''}</option>`).join('')}</select><button type="button" class="output-remove" data-output-remove-resource="${index}:${slot}" ${draft.resourceIds.length===1?'disabled':''} aria-label="移除成品 ${index+1} 的资源 ${slot+1}">移除</button></div>${resource?`<div class="output-resource-preview">${preview(resource)}</div>`:''}</div>`;
      }).join('')}</div><button type="button" class="output-add-resource" data-output-add-resource="${index}" ${draft.resourceIds.length>=10||used.size>=resources.length?'disabled':''}>＋ 添加资源</button></article>`;
  }
  function render(task){
    mountedTask=task.id;mountedSession=session();
    const context=taskContextByTask(task),resources=resourcesFor(task),active=task.status==='in_progress',status=taskStatusMeta[task.status];
    const drafts=active?draftsFor(task):[],used=new Set(drafts.flatMap(draft=>draft.resourceIds).filter(Boolean));
    const works=(context?.project.works||[]).filter(work=>work.runId===task.workId);
    taskDetailPanel.innerHTML=`<div class="work-output-workbench"><header class="task-detail-header output-task-header"><div class="task-detail-title"><i class="task-node-icon output" aria-hidden="true">成</i><div><span class="task-detail-kicker">WORK ASSEMBLY</span><h2>成品组装</h2><p><span data-task-display-name>${escapeHtml(task.workName)}</span></p></div><span class="task-status ${status.className}">${status.label}</span></div><div class="task-detail-context"><span>${escapeHtml(task.projectName)}</span><span>来源运行：${escapeHtml(context?.work.serial||task.workId)}</span></div></header>
      ${active?`<div class="output-task-body"><section class="output-composer" aria-label="成品组装"><div class="output-section-heading"><div><h3>成品组装</h3><p>组合当前工作流的输出与备选资源，提交后生成成品。</p></div><button type="button" class="output-secondary" data-output-add-work ${used.size>=resources.length?'disabled':''}>＋ 新增成品</button></div><p class="output-guidance">每个成品可添加 1～10 个资源，不限制资源类型。同一资源不可重复选择，确认提交后生效。</p>
      <div class="output-work-list">${drafts.map((draft,index)=>workCard(draft,index,resources,used,drafts.length)).join('')}</div></section>
      <aside class="output-source-panel" aria-label="结果资源信息"><div class="output-section-heading"><div><h3>结果资源信息</h3><p>${resources.length} 个资源可用于组合</p></div></div>${[['selected','输出资源'],['backup','备选资源']].map(([state,label])=>`<section class="output-source-group"><h4>${label} <span>${resources.filter(resource=>resource.selectionState===state).length}</span></h4>${resources.filter(resource=>resource.selectionState===state).map(resource=>`<article class="output-source-resource"><header><b>${escapeHtml(title(resource))}</b>${badge(resource)}</header><small>${escapeHtml(kind(resource))} · ${escapeHtml(resource.node||'结果资源信息')} · ${escapeHtml(resource.version||'V1')}</small>${preview(resource)}</article>`).join('')||'<p class="output-media-empty">暂无资源</p>'}</section>`).join('')}</aside></div>
      <footer class="output-task-footer"><p class="output-form-error" role="alert" hidden></p><small>共 ${drafts.length} 个成品 · 已选择 ${used.size} 个资源</small><div><button type="button" class="task-return-button" data-task-action="return">打回</button><button type="button" class="output-submit" data-output-submit>确认提交</button></div></footer>`:
      `<section class="output-completed" aria-label="已输出成品"><div class="output-section-heading"><div><h3>${works.length?'成品已输出':'该任务已结束'}</h3><p>${works.length?`已生成 ${works.length} 个成品，可查看全部资源。`:'该任务未输出成品。'}</p></div>${works.length?'<button type="button" class="output-secondary" data-output-view-finished>查看成品</button>':''}</div>${works.map(work=>`<article class="output-work-card"><header><h3>${escapeHtml(work.name)}</h3><span>${work.resources.length} 个资源</span></header>${work.resources.map(resource=>`<div class="output-source-resource"><header><b>${escapeHtml(title(resource))}</b><small>${escapeHtml(kind(resource))}</small></header>${preview(resource)}</div>`).join('')}</article>`).join('')}</section>`}</div>`;
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
  taskDetailPanel.addEventListener('input',event=>{
    if(!event.target.matches('[data-output-name]'))return;
    const task=activeTask();if(!task)return;
    draftsFor(task)[Number(event.target.dataset.outputName)].name=event.target.value;saveDraft(task,false);
  });
  taskDetailPanel.addEventListener('change',event=>{
    const control=event.target;if(!control.matches('[data-output-resource]'))return;
    const task=activeTask();if(!task)return;
    const [work,slot]=control.dataset.outputResource.split(':').map(Number),drafts=draftsFor(task),value=control.value;
    if(value&&drafts.some((draft,i)=>draft.resourceIds.some((id,j)=>id===value&&(i!==work||j!==slot)))){control.value=drafts[work].resourceIds[slot];showError('该资源已选择，请选择其他资源');return}
    drafts[work].resourceIds[slot]=value;saveDraft(task);
  });
  taskDetailPanel.addEventListener('click',event=>{
    if(event.target.closest('[data-output-view-finished]')){switchPage('finished');renderFinishedLibrary();return}
    const task=activeTask();if(!task)return;
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.hasAttribute('data-output-submit')){requestSubmit(task);return}
    const drafts=draftsFor(task),used=new Set(drafts.flatMap(draft=>draft.resourceIds).filter(Boolean));let changed=false;
    if(button.hasAttribute('data-output-add-work')&&used.size<resourcesFor(task).length){drafts.push({name:'',resourceIds:['']});changed=true}
    if(button.hasAttribute('data-output-remove-work')&&drafts.length>1){drafts.splice(Number(button.dataset.outputRemoveWork),1);changed=true}
    if(button.hasAttribute('data-output-add-resource')){const draft=drafts[Number(button.dataset.outputAddResource)];if(draft.resourceIds.length<10&&used.size<resourcesFor(task).length){draft.resourceIds.push('');changed=true}}
    if(button.hasAttribute('data-output-remove-resource')){const [work,slot]=button.dataset.outputRemoveResource.split(':').map(Number);if(drafts[work].resourceIds.length>1){drafts[work].resourceIds.splice(slot,1);changed=true}}
    if(changed)saveDraft(task);
  });
  taskDetailPanel.addEventListener('play',event=>{
    if(event.target.closest('.work-output-workbench'))taskDetailPanel.querySelectorAll('audio').forEach(audio=>{if(audio!==event.target)audio.pause()});
  },true);
  function initialize(){
    const project=projectData.find(item=>item.id==='orchestra-theme-album'),member=project&&projectAssignableMembers(project)[0];if(!member)return;
    let run=project.runs.find(item=>item.id===runId);
    if(!project.batches.some(plan=>plan.id===planId))project.batches.push({id:planId,name:'成品组装示例计划',quantity:1,workflowId:'work-output-production',workflowName:'词曲与成品组装流程',workflowVersion:'V1.0',delivery:'2026-10-31',notes:'将工作流的输出与备选资源组合为成品。'});
    const plan=project.batches.find(item=>item.id===planId);
    if(plan.name==='作品输出示例计划')plan.name='成品组装示例计划';
    if(plan.workflowName==='词曲与作品输出流程')plan.workflowName='词曲与成品组装流程';
    const now=Date.now();
    if(!run){
      run={id:runId,serial:reserveDailyProductionNumbers({flow:1})?.flow[0]||runId,name:'成品组装示例',planId,planName:'成品组装示例计划',status:'进行中',stage:'成品组装',workOutputDemo:true,owner:member.name,lastAssigneeId:member.id,createdAt:new Date(now).toISOString(),startedAt:new Date(now-20*60000).toISOString(),resources:[]};
      const base={runId,planId,version:'V1'};
      run.resources=[
        {...base,id:runId+'-lyrics-a',kind:'歌词',title:'晨间来信 · 正式歌词',node:'基于参考生成歌词',selectionState:'selected',content:window.orchestraReferenceSongTask?.lyrics||'清晨的风推开窗\n把昨日心事轻轻放\n沿着光亮去远方\n每一步都有回响'},
        {...base,id:runId+'-audio-a',kind:'音频',title:'晨间来信 · 版本一',node:'基于参考曲生成歌曲',selectionState:'selected',url:'./assets/reference-song-result-a.wav'},
        {...base,id:runId+'-cover',kind:'图片',title:'晨间来信 · 封面',node:'封面资源',selectionState:'selected',url:'./assets/work-output-demo-cover.svg'},
        {...base,id:runId+'-lyrics-b',kind:'歌词',title:'晨间来信 · 备选歌词',node:'基于参考生成歌词',selectionState:'backup',version:'V2',content:'当第一束光落在肩上\n我听见远方轻轻歌唱\n那些没有说完的话\n都开成了清晨的花'},
        {...base,id:runId+'-audio-b',kind:'音频',title:'晨间来信 · 版本二',node:'基于参考曲生成歌曲',selectionState:'backup',version:'V2',url:'./assets/reference-song-result-b.wav'}
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
    syncProjectPlanProductionProgress(project);persistProductionTasks();persistProjectWorkAssignments();modelPersist();renderTaskCenter();
  }
  window.orchestraWorkOutputTask={render,stopAudio,validateDrafts,requestSubmit,initialize};
  window.addEventListener('pagehide',stopAudio);
  if(document.readyState==='complete')initialize();else window.addEventListener('load',initialize,{once:true});
})();
