/* Execution instances live in project.runs. Confirmed compositions live in project.works.
 * Task engine keeps its legacy workId key as an execution-instance foreign key.
 * Statistics below use explicit demonstration events; proposed attribution is not a confirmed business rule.
 */
const productionModelKey='orchestra-production-model-v1';
const modelClone=value=>JSON.parse(JSON.stringify(value));
const modelProject=()=>projectData.find(p=>p.id===selectedProjectId);
const modelTime=value=>value?new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'—';
const modelDate=value=>new Date(value).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
const modelDone=run=>['已完成','已交付'].includes(run.status);
const modelButton=(attr,value,label)=>`<button type="button" ${attr}="${escapeHtml(value)}">${escapeHtml(label)}</button>`;
const modelTable=(headers,rows,className='')=>`<div class="model-table-scroll"><table class="model-table ${className}"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map(c=>`<td>${c??'—'}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="model-empty">暂无符合条件的记录</td></tr>`}</tbody></table></div>`;
function renderProjectRunStatistics(project){
 const runs=project.runs||[],running=runs.filter(run=>['制作中','进行中'].includes(run.status)).length,completed=runs.filter(modelDone).length;
 const works=(project.works||[]).length,resources=runs.reduce((count,run)=>count+modelResources(project,run).length,0);
 const items=[
  ['正在运行',running,'次','当前处于运行中的生产运行数量'],
  ['运行完成',completed,'次','已完成的生产运行数量，每次运行计一次'],
  ['已生成作品数',works,'个','通过资源组合并成功保存的正式作品数量'],
  ['已产出资源数',resources,'个','生产运行实际产出的歌词、音频等资源数量']
 ];
 const root=document.querySelector('#projectRunStatisticsCards');if(!root)return;
 root.innerHTML=items.map(([label,value,unit,description])=>`<article class="project-stat-card"><div class="project-stat-label"><span>${label}</span><button type="button" class="project-stat-help" aria-label="${description}" data-tooltip="${description}"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M8.1 7.6a2 2 0 1 1 3.8.9c-.5.8-1.9 1.1-1.9 2.5" stroke-linecap="round"/><circle cx="10" cy="13.7" r=".7" fill="currentColor" stroke="none"/></svg></button></div><strong>${value}<small>${unit}</small></strong></article>`).join('');
}
let formalPlanFilter='all';
const statisticsState={};
function modelPersist(){try{localStorage.setItem(productionModelKey,JSON.stringify(projectData));return true}catch{showToast('保存失败，请检查浏览器存储空间','error');return false}}
function modelDialog(title,html,className=''){const d=document.createElement('dialog');d.className=`model-dialog ${className}`.trim();d.innerHTML=`<header><h2>${escapeHtml(title)}</h2><button type="button" data-close aria-label="关闭">×</button></header>${html}`;d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>{d.querySelectorAll('audio').forEach(a=>a.pause());d.remove()});document.body.append(d);d.showModal();return d}
function modelResources(project,run){
 run.resources||=[];
 // Existing completed demo records have no actual generated media: never fabricate their output.
 const tasks=productionTasks.filter(t=>t.projectId===project.id&&String(t.workId)===String(run.id));
 for(const task of tasks){
  const lyrics=task.form?.lyrics||task.form?.lyricsContent;
  if(lyrics&&!run.resources.some(r=>r.id===`${task.id}-lyrics`))run.resources.push({id:`${task.id}-lyrics`,kind:'歌词',version:'V1',node:task.nodeTitle,runId:run.id,planId:run.planId,content:lyrics});
 }
 return run.resources;
}
function modelSeed(){
 projectData.forEach(p=>{p.works=[];p.calls=[];p.metricTasks=[];(p.runs||[]).forEach(r=>delete r.workNumber);for(const plan of p.batches){const runs=p.runs.filter(r=>r.planId===plan.id);plan.quantity=runs.length;}});
 const p=projectData[0];p.title='音乐内容生产示例';p.customer='番茄平台';p.owner='张三';
 const plan={id:'DEMO-PLAN-10',name:'示例：10 次运行 / 12 首作品',quantity:10,workflowId:'reference-production',workflowName:'参考词曲完整流程',workflowVersion:'V1.0',delivery:'2026-09-30',notes:'验收示例：8 次运行完成，12 首正式作品；剩余 2 次等待人员分配。'};p.batches.unshift(plan);
 for(let i=0;i<10;i++){
  const id=`DEMO-RUN-${String(i+1).padStart(3,'0')}`,done=i<8;
  const run={id,serial:id,name:`示例运行 ${i+1}`,planId:plan.id,planName:plan.name,status:done?'已完成':'制作中',stage:done?'已完成':'等待人员分配',owner:'未分配',demoOwner:i%2?'李四':'张三',startedAt:done?`2026-09-${21+i%3}T09:00:00+08:00`:null,completedAt:done?`2026-09-${21+i%3}T10:00:00+08:00`:null,createdAt:'2026-09-21T08:00:00+08:00',resources:[]};
  if(done)run.resources=[{id:`${id}-L1`,kind:'歌词',version:'V1',node:'歌词审核',runId:id,planId:plan.id,content:`晚风穿过第 ${i+1} 扇窗\n把星光写进我们的歌\n沿着晨曦轻轻唱\n让每个明天都有回响`},{id:`${id}-A1`,kind:'音频',version:'V1',node:'歌曲审核',runId:id,planId:plan.id,url:'./assets/demo-tone.wav',label:'合成试听音（非真实歌曲）'}];
  p.runs.push(run);
  if(done)for(let j=0;j<(i<4?2:1);j++)p.works.push({id:`DEMO-WORK-${String(p.works.length+1).padStart(3,'0')}`,name:`晚风与星光 ${i+1}${j?' · 另选版':''}`,planId:plan.id,runId:id,resources:modelClone(run.resources),creator:i%2?'李四':'张三',createdAt:run.completedAt,projectId:p.id});
  if(done)for(let n=0;n<2;n++){
   p.calls.push({id:`REQ-${i}-${n}`,person:run.demoOwner,planId:plan.id,api:n?'歌曲生成 API':'歌词生成 API',start:run.startedAt,end:run.completedAt,result:i===7&&n===0?'失败':'成功',workflow:plan.workflowName,version:plan.workflowVersion,runId:id,node:n?'歌曲生成':'歌词生成'});
   p.metricTasks.push({id:`TASK-DEMO-${i}-${n}`,person:run.demoOwner,assignedAt:run.startedAt,completedAt:run.completedAt,planId:plan.id,runId:id,firstReview:i===7?'未审核':i===6?'未通过':'通过',reviewAt:run.completedAt});
  }
 }
 p.calls.push({id:'REQ-pending',person:'张三',planId:plan.id,api:'歌词生成 API',start:'2026-09-23T11:00:00+08:00',end:null,result:'执行中',workflow:plan.workflowName,version:plan.workflowVersion,runId:'DEMO-RUN-009',node:'歌词生成'});
 p.metricTasks.push({id:'TASK-DEMO-pending',person:'张三',assignedAt:'2026-09-23T09:00:00+08:00',completedAt:null,planId:plan.id,runId:'DEMO-RUN-009',firstReview:'未审核'});
}
try{const saved=JSON.parse(localStorage.getItem(productionModelKey)||'null');if(Array.isArray(saved)&&saved.length){projectData.splice(0,projectData.length,...saved);selectedProjectId=projectData[0].id}else modelSeed()}catch{modelSeed()}

for(const project of projectData)for(const run of project.runs||[]){
 if(!/^DEMO-RUN-\d+$/.test(run.id)||!modelDone(run))continue;
 run.resources||=[];
 const extras=[{id:`${run.id}-L2`,kind:'歌词',title:'晚风 · 抒情版',version:'V2',node:'歌词生成',runId:run.id,planId:run.planId,content:'晚风落在街角的窗台\n把未说的话慢慢展开\n星光陪着我们走过长夜\n下一站有你期待的晴天'},{id:`${run.id}-L3`,kind:'歌词',title:'晨光 · 轻快版',version:'V3',node:'歌词生成',runId:run.id,planId:run.planId,content:'向着晨光出发\n让风带走牵挂\n每一个新的节拍\n都是明天的回答'},{id:`${run.id}-A2`,kind:'音频',title:'歌曲方案 B',version:'V2',node:'歌曲生成',runId:run.id,planId:run.planId,url:'./assets/demo-tone.wav',label:'示例方案 B · 合成试听音（非真实歌曲）'},{id:`${run.id}-A3`,kind:'音频',title:'歌曲方案 C',version:'V3',node:'歌曲生成',runId:run.id,planId:run.planId,url:'./assets/demo-tone.wav',label:'示例方案 C · 合成试听音（非真实歌曲）'}];
 for(const resource of extras)if(!run.resources.some(r=>r.id===resource.id))run.resources.push(resource);
}

const modelDemoNodes=[
 ['文本输入',''],['自己写歌词',''],['自己上传歌曲',''],
 ['AI 生成歌词','歌词生成服务'],['基于参考生成歌词','歌词生成服务'],['AI 生成歌曲','歌曲生成服务'],
 ['基于参考曲生成歌曲','歌曲生成服务'],['基于歌单生成歌曲','歌曲生成服务'],['基于采样生成歌曲','歌曲生成服务'],
 ['歌词入库',''],['音频入库',''],['声伴分离','声伴分离服务'],['RVC 音色转换','音色转换服务']
];
function modelEnsureDemoNodeCalls(p=projectData.find(item=>item.id===selectedProjectId)){
 if(!p)return;p.calls||=[];
 const plan=p.batches?.find(item=>item.id==='DEMO-PLAN-10')||p.batches?.[0];if(!plan)return;
 const relatedRuns=(p.runs||[]).filter(run=>run.planId===plan.id);
 const now=Date.now(),today=modelDate(new Date()),dayStart=new Date(`${today}T00:00:00+08:00`).getTime();let changed=false;
 modelDemoNodes.forEach(([node,api],index)=>{
  const id=`REQ-NODE-DEMO-${String(index+1).padStart(2,'0')}`,startMs=Math.max(dayStart,now-(modelDemoNodes.length-index)*60*1000),start=new Date(startMs).toISOString();
  const result=index===6||index===12?'失败':index===8?'执行中':'成功';
  const end=result==='执行中'?null:new Date(Math.min(now,startMs+5*60*1000)).toISOString();
  const relatedRun=relatedRuns.length?relatedRuns[index%relatedRuns.length]:null;
  const sample={id,person:index%2?'李四':'张三',planId:plan.id,api,start,end,result,failureReason:result==='失败'?'演示记录：节点输出未通过校验':'',workflow:plan.workflowName||'示例工作流',version:plan.workflowVersion||'V1.0',runId:relatedRun?.serial||relatedRun?.id||`DEMO-RUN-${String(index+1).padStart(3,'0')}`,node};
  const existing=p.calls.find(call=>call.id===id);
  if(!existing){p.calls.push(sample);changed=true}
  else if(Object.entries(sample).some(([key,value])=>existing[key]!==value)){Object.assign(existing,sample);changed=true}
 });
 if(changed)modelPersist();
}
syncProjectPlanProductionProgress=function(project){for(const plan of project.batches){const runs=(project.runs||[]).filter(r=>r.planId===plan.id);plan.completed=new Set(runs.filter(modelDone).map(r=>r.id)).size;plan.productionStatus=plan.completed===Number(plan.quantity)&&runs.length===Number(plan.quantity)?'已完成':'生产中';plan.status=plan.productionStatus}};
renderProjectPlans=function(project){syncProjectPlanProductionProgress(project);const plans=project.batches||[];projectPlanList.innerHTML=modelTable(['计划名称','计划运行次数','已完成运行次数','实际作品数','状态','工作流及版本','交付日期','备注','操作'],plans.map(p=>[escapeHtml(p.name),p.quantity,p.completed,(project.works||[]).filter(w=>w.planId===p.id).length,`<span class="model-status">${p.status}</span>`,escapeHtml(`${p.workflowName} ${p.workflowVersion}`),escapeHtml(p.delivery||'—'),escapeHtml(richTextPlainText(p.notes)||'—'),modelButton('data-model-runs',p.id,'查看运行')]));projectPlanTableWrap.hidden=!plans.length;projectPlanEmpty.hidden=!!plans.length};
projectWorkRow=function(run,index,map,project){const plan=project.batches.find(p=>p.id===run.planId);return `<div class="project-work-row" data-work-row="${escapeHtml(run.id)}"><div><input type="checkbox" data-work-select="${escapeHtml(run.id)}" aria-label="选择运行 ${escapeHtml(run.serial)}" ${selectedProjectWorkIds.has(String(run.id))?'checked':''} ${modelDone(run)?'disabled':''}></div><div>${escapeHtml(run.serial)}</div><div>${escapeHtml(map.get(run.planId)||'—')}</div><div>${escapeHtml(`${plan?.workflowName||'—'} ${plan?.workflowVersion||''}`)}</div><div>${modelDone(run)?'已完成':escapeHtml(run.status==='制作中'?'进行中':run.status)}</div><div>${modelDone(run)?'—':escapeHtml(run.stage||'等待分配')}</div><div>${escapeHtml(run.demoOwner?`${run.demoOwner}（示例）`:'待确认')}</div><div>${modelTime(run.startedAt)}</div><div>${modelTime(run.completedAt)}</div><div>${(project.works||[]).filter(w=>w.runId===run.id).length}</div><div>${modelDone(run)?modelButton('data-model-resources',run.id,'查看资源'):modelButton('data-model-assign',run.id,'分配人员')}</div></div>`};
const legacyRenderRuns=renderProjectWorks;
renderProjectWorks=function(project){legacyRenderRuns(project);const head=projectWorksGrid.querySelector('.head');head.innerHTML='<div><input type="checkbox" data-work-select-all aria-label="全选未完成运行"></div>'+['运行编号','所属计划','工作流及版本','状态','当前节点','负责人¹','开始时间','结束时间','关联作品数','操作'].map(s=>`<span>${s}</span>`).join('');syncProjectWorkSelectionUI(visibleProjectWorks(project));renderProjectRunStatistics(project);};
const oldVisibleSelection=setVisibleProjectWorksSelection;
setVisibleProjectWorksSelection=function(checked){oldVisibleSelection(checked);const p=modelProject();p.runs.filter(modelDone).forEach(r=>selectedProjectWorkIds.delete(String(r.id)));renderProjectWorks(p)};
function showFormalWork(project,work){const d=modelDialog('作品详情 · 资源追溯',`<p>${escapeHtml(work.id)} · 来源运行 ${escapeHtml(work.runId)}</p><label>作品名称 <input id="formalName" maxlength="100" value="${escapeHtml(work.name)}"></label><button type="button" id="saveFormalName">保存名称</button><p>创建人：${escapeHtml(work.creator)} · ${modelTime(work.createdAt)}</p>${work.resources.map(r=>`<article class="model-resource"><b>${escapeHtml(r.kind)} · ${escapeHtml(r.version)}</b><small>${escapeHtml(r.id)} · 来源运行 ${escapeHtml(r.runId)} · 节点 ${escapeHtml(r.node)}</small>${r.kind==='歌词'?`<pre>${escapeHtml(r.content)}</pre>`:`<audio controls src="${escapeHtml(r.url)}"></audio>`}</article>`).join('')}`);d.querySelector('#saveFormalName').onclick=()=>{const input=d.querySelector('#formalName'),name=input.value.trim();if(!name){input.setCustomValidity('请输入作品名称');input.reportValidity();return}const old=work.name;work.name=name;if(!modelPersist()){work.name=old;return}renderProjectDetail();if(typeof renderFinishedLibrary==='function')renderFinishedLibrary();d.close();showToast('作品名称已更新，作品数不变')}}
function modelApplyDatePreset(state,preset,now=new Date()){
 const today=modelDate(now);state.datePreset=preset;state.to=today;
 if(preset==='seven'){state.rangeStart=now.getTime()-7*24*60*60*1000;state.rangeEnd=now.getTime();state.from=modelDate(state.rangeStart)}
 else {state.from=preset==='month'?today.slice(0,7)+'-01':today;state.rangeStart=new Date(state.from+'T00:00:00+08:00').getTime();state.rangeEnd=now.getTime()}
 return state;
}
function modelStatsState(project){const state=statisticsState[project.id]||=modelApplyDatePreset({person:'all',plan:'all',api:'all',node:'all',period:'day',dimension:'task',view:'overview',expandedPeople:[]},'today');state.view||='overview';state.expandedPeople||=[];return state}
function modelCallPerson(call){return call.person?.trim()||'系统／未归属'}
function modelInPeriod(value,state){
 if(!value)return false;const timestamp=new Date(value).getTime();if(!Number.isFinite(timestamp))return false;
 if(state.datePreset&&state.datePreset!=='custom')return timestamp>=state.rangeStart&&timestamp<=state.rangeEnd;
 const date=modelDate(value);return (!state.from||date>=state.from)&&(!state.to||date<=state.to);
}
function modelFilteredCalls(project,state,kind){const seen=new Set();return (project.calls||[]).filter(c=>{if(seen.has(c.id))return false;seen.add(c.id);return modelInPeriod(c.start,state)&&(state.person==='all'||modelCallPerson(c)===state.person)&&(state.plan==='all'||c.planId===state.plan)&&(kind!=='consumption'||state.node==='all'||c.node===state.node)&&(!state.result||c.result===state.result)})}
function modelPeriod(value,period){const day=modelDate(value);if(period==='month')return day.slice(0,7);if(period==='week'){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10)+' 周'}return day}
function modelStatsFilters(project,state,kind,view='overview'){
 const options=(values,current)=>'<option value="all">全部</option>'+values.map(v=>`<option value="${escapeHtml(v)}" ${current===v?'selected':''}>${escapeHtml(v)}</option>`).join('');
 const hiddenNodes=new Set(['文本输入','自己写歌词','自己上传歌曲','歌词入库','音频入库']);
 const nodeOptions=[...new Set((project.calls||[]).map(c=>c.node).filter(node=>node&&!hiddenNodes.has(node)))];
 if(!nodeOptions.includes('svc音色转换'))nodeOptions.push('svc音色转换');
 if(state.node!=='all'&&!nodeOptions.includes(state.node))state.node='all';
 const people=[...new Set([...(project.calls||[]).map(modelCallPerson),...(kind==='efficiency'?(project.metricTasks||[]).map(t=>t.person):[]),...(kind==='efficiency'?(project.works||[]).map(w=>w.creator):[])].filter(Boolean))];
 const personFilter=`<label>人员 <select data-stat="person">${options(people,state.person)}</select></label>`;
 const callFilter=kind==='consumption'?`<label>节点 <select data-stat="node">${options(nodeOptions,state.node)}</select></label>`:'';
 const periodFilter=kind==='consumption'&&view==='overview'?`<label>统计周期 <select data-stat="period">${[['day','天'],['week','周'],['month','月']].map(([value,label])=>`<option value="${value}" ${state.period===value?'selected':''}>${label}</option>`).join('')}</select></label>`:'';
 const personControl=personFilter;
 const dimensionLabel=kind==='efficiency'?`<label class="stats-dimension-field">统计维度 <span class="stats-dimension-help" tabindex="0" role="img" aria-label="任务维度：每个节点任务计一次，同一任务重复执行仍计一次。运行维度：同一人参与同一条运行中的多个节点，只计作一条运行；运行中计入运行中数量，完成后计入已完成数量，不按节点重复累计。" data-tooltip="任务：每个节点任务计一次，同一任务重复执行仍计一次。&#10;运行：同一人参与同一条运行中的多个节点，只计作一条运行；运行中计入运行中数量，完成后计入已完成数量，不按节点重复累计。"><svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M8.1 7.6a2 2 0 1 1 3.8.9c-.5.8-1.9 1.1-1.9 2.5" stroke-linecap="round"/><circle cx="10" cy="13.7" r=".7" fill="currentColor" stroke="none"/></svg></span><select data-stat="dimension">${[['task','任务'],['flow','运行']].map(([v,l])=>`<option value="${v}" ${state.dimension===v?'selected':''}>${l}</option>`).join('')}</select></label>`:'';
 return `<div class="model-toolbar model-filters"><div class="model-date-presets" role="group" aria-label="快捷时间">${[['today','当前'],['seven','近七天'],['month','本月']].map(([value,label])=>`<button type="button" data-date-preset="${value}" aria-pressed="${state.datePreset===value}" class="${state.datePreset===value?'active':''}">${label}</button>`).join('')}</div><label>开始日期 <input type="date" data-stat="from" value="${state.from}"></label><label>结束日期 <input type="date" data-stat="to" value="${state.to}"></label><label>生产计划 <select data-stat="plan"><option value="all">全部</option>${project.batches.map(p=>`<option value="${escapeHtml(p.id)}" ${state.plan===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></label>${callFilter}${personControl}${periodFilter}${dimensionLabel}<button type="button" data-stat-reset>重置</button></div>`;
}
function modelRunDetailButton(person,node,result,label){return `<button type="button" class="run-stat-count" data-run-detail data-person="${escapeHtml(person||'')}" data-node="${escapeHtml(node||'')}" data-result="${escapeHtml(result||'')}">${escapeHtml(label)}</button>`}
function modelCallDetails(project,state,person,kind='consumption'){
 const next={...state,...(person?{person}:{})},rows=modelFilteredCalls(project,next,kind),planName=id=>project.batches.find(p=>p.id===id)?.name||'—';
 const dateRange=next.from&&next.to?`${next.from} 至 ${next.to}`:'全部日期';
 const filters=[['日期',dateRange],['人员',next.person!=='all'?next.person:'全部人员'],['生产计划',next.plan!=='all'?planName(next.plan):'全部生产计划'],['节点',next.node!=='all'?next.node:'全部节点'],['结果',next.result||'全部结果']];
 const filterSummary=filters.map(([label,value])=>`<span class="run-detail-filter"><small>${label}</small><b>${escapeHtml(value)}</b></span>`).join('');
 const resultCell=c=>`<span class="run-detail-result ${c.result==='成功'?'is-success':c.result==='失败'?'is-failed':'is-running'}">${c.result==='执行中'?'运行中':escapeHtml(c.result||'—')}</span>`;
 const failureCell=c=>`<span class="run-detail-failure">${escapeHtml(c.result==='失败'?(c.failureReason||c.errorMessage||'暂无失败原因'):'—')}</span>`;
 const table=modelTable(['运行记录编号','人员','生产计划','流水编号','工作流及版本','节点','开始时间','结束时间','结果','失败原因'],rows.map(c=>[
  `<span class="run-detail-identifier">${escapeHtml(c.id)}</span>`,escapeHtml(modelCallPerson(c)),escapeHtml(planName(c.planId)),`<span class="run-detail-identifier">${escapeHtml(c.runId)}</span>`,escapeHtml(`${c.workflow||'—'} ${c.version||''}`.trim()),escapeHtml(c.node||'—'),`<time class="run-detail-datetime">${escapeHtml(modelTime(c.start))}</time>`,`<time class="run-detail-datetime">${escapeHtml(modelTime(c.end))}</time>`,resultCell(c),failureCell(c)
 ]),'run-detail-table');
 modelDialog('运行明细',`<section class="run-detail-summary" aria-label="当前筛选条件"><div class="run-detail-summary-title"><b>筛选条件</b><span>${rows.length} 条节点运行记录</span></div><div class="run-detail-filters">${filterSummary}</div><small class="run-detail-note">关闭后保留当前筛选和展开状态</small></section>${table}`,'model-run-drawer');
}
function modelInterfaceConsumption(calls){
 // Consumption comes from metering records, never from request counts.
 if(!calls.length)return '—';
 if(calls.some(c=>typeof c.consumptionAmount!=='number'||!Number.isFinite(c.consumptionAmount)||!c.consumptionUnit))return '<span title="接口消耗数据尚未接入">—</span>';
 const totals=new Map();calls.forEach(c=>totals.set(c.consumptionUnit,(totals.get(c.consumptionUnit)||0)+c.consumptionAmount));
 return [...totals].map(([unit,total])=>`${total.toLocaleString('zh-CN',{maximumFractionDigits:4})} ${escapeHtml(unit)}`).join(' / ');
}
function modelRunCounts(calls){return {total:calls.length,success:calls.filter(c=>c.result==='成功').length,failed:calls.filter(c=>c.result==='失败').length}}
function modelPeopleRunSummary(project,calls,state){
 const people=[...new Set(calls.map(modelCallPerson))],expanded=new Set(state.expandedPeople),headers=['人员','运行总次数','成功次数','失败次数','操作'];
 const countCell=(person,node,result,count)=>modelRunDetailButton(person,node,result,String(count));
 const rows=people.map(person=>{
  const personCalls=calls.filter(c=>modelCallPerson(c)===person),counts=modelRunCounts(personCalls),isExpanded=expanded.has(person);
  const nodes=[...new Set(personCalls.map(c=>c.node||'未知节点'))].map(node=>[node,personCalls.filter(c=>(c.node||'未知节点')===node)]);
  const nodeRows=nodes.map(([node,items])=>{const n=modelRunCounts(items);return [escapeHtml(node),countCell(person,node,'',n.total),countCell(person,node,'成功',n.success),countCell(person,node,'失败',n.failed)]});
  const nodeTable=modelTable(['节点名称','运行总次数','成功次数','失败次数'],nodeRows);
  return `<tr><td><button type="button" class="run-stat-person-toggle" data-run-expand="${escapeHtml(person)}" aria-expanded="${isExpanded}" aria-label="${isExpanded?'收起':'展开'}${escapeHtml(person)}的节点统计">${escapeHtml(person)}</button></td><td>${countCell(person,'','',counts.total)}</td><td>${countCell(person,'','成功',counts.success)}</td><td>${countCell(person,'','失败',counts.failed)}</td><td>${countCell(person,'','','查看明细')}</td></tr><tr class="run-stat-person-detail" data-person-detail="${escapeHtml(person)}" ${isExpanded?'':'hidden'}><td colspan="5">${nodeTable}</td></tr>`;
 }).join('');
 return `<div class="model-table-scroll"><table class="model-table run-stat-people-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="model-empty">暂无符合条件的记录</td></tr>`}</tbody></table></div>`;
}
function renderModelStats(project,kind){
 if(kind==='consumption')modelEnsureDemoNodeCalls(project);
 const state=modelStatsState(project),root=document.querySelector(kind==='consumption'?'#consumptionPanel':'#projectEfficiencyPanel'),calls=modelFilteredCalls(project,state,kind);
 let html='';
 if(kind==='consumption')html=`<nav class="run-stat-tabs" role="tablist" aria-label="运行统计页面">${[['overview','运行概览'],['people','人员汇总']].map(([view,label])=>`<button type="button" role="tab" data-stat-subtab="${view}" aria-selected="${state.view===view}" class="${state.view===view?'active':''}">${label}</button>`).join('')}</nav>`;
 html+=modelStatsFilters(project,state,kind,state.view);
 if(state.from&&state.to&&state.from>state.to)html+='<p role="alert">开始日期不能晚于结束日期。</p>';
 if(kind==='consumption'){
  if(state.view==='people'){
   html+='<div class="run-stat-table-heading"><h3>人员节点汇总</h3></div>'+modelPeopleRunSummary(project,calls,state);
  }else{
   const counts=modelRunCounts(calls),cards=[['节点运行总次数',counts.total,''],['成功次数',counts.success,'成功'],['失败次数',counts.failed,'失败']];
   html+=`<div class="model-metrics run-stat-metrics">${cards.map(([label,count,result])=>`<article><small>${label}</small><button type="button" data-stat-result="${result}">${count}</button></article>`).join('')}</div>`;
   const groups=new Map();calls.forEach(c=>{const key=modelPeriod(c.start,state.period);groups.set(key,[...(groups.get(key)||[]),c])});
   const groupedRows=[...groups].sort(([a],[b])=>a.localeCompare(b)).map(([key,items])=>{const n=modelRunCounts(items);return [escapeHtml(key),n.total,n.success,n.failed]});
   html+='<div class="run-stat-table-heading"><h3>周期统计</h3></div>'+modelTable(['日期','运行总次数','成功次数','失败次数'],groupedRows,'run-stat-period-table');
  }
 }else{
  const tasks=(project.metricTasks||[]).filter(t=>modelInPeriod(t.assignedAt,state)&&(state.plan==='all'||t.planId===state.plan));
  const people=[...new Set([...tasks.map(t=>t.person),...calls.map(c=>c.person),...(project.works||[]).map(w=>w.creator)])].filter(p=>state.person==='all'||p===state.person);
  html+=modelTable(['人员','总数量','进行中数量（当前）','已完成数量','完成率 <span class="completion-rate-help" tabindex="0" role="img" aria-label="完成率 =（已完成数量 ÷ 总数量）× 100%" data-tooltip="完成率 =（已完成数量 ÷ 总数量）× 100%"><svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M7.8 7.2a2.25 2.25 0 0 1 4.4.6c0 1.5-2.2 1.8-2.2 3.3" stroke-linecap="round"/><circle cx="10" cy="13.6" r=".75" fill="currentColor" stroke="none"/></svg></span>'],people.map(person=>{
   const cohort=tasks.filter(t=>t.person===person),end=state.to||'9999-12-31',done=cohort.filter(t=>t.completedAt&&modelDate(t.completedAt)<=end),active=cohort.filter(t=>(!t.completedAt||modelDate(t.completedAt)>end)&&!(t.status==='terminated'&&(!t.terminatedAt||modelDate(t.terminatedAt)<=end)));
   const rate=(n,d)=>d?`${(n/d*100).toFixed(1)}%（${n}/${d}）`:'—（分母为 0）';
   return [modelButton('data-stat-person',person,person),modelButton('data-metric-detail',person+'|assigned',String(cohort.length)),modelButton('data-metric-detail',person+'|active',String(active.length)),modelButton('data-metric-detail',person+'|completed',String(done.length)),modelButton('data-metric-detail',person+'|cohort',rate(done.length,cohort.length))];
  }));
 }
 root.innerHTML=html;
 root.querySelectorAll('[data-stat-subtab]').forEach(button=>button.onclick=()=>{state.view=button.dataset.statSubtab;renderModelStats(project,kind)});
 root.querySelector('.run-stat-tabs')?.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const tabs=[...root.querySelectorAll('[data-stat-subtab]')],index=tabs.indexOf(event.target.closest('[data-stat-subtab]'));if(index<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click()});
 root.querySelectorAll('[data-stat]').forEach(el=>el.onchange=()=>{state[el.dataset.stat]=el.value;if(['from','to'].includes(el.dataset.stat)){state.datePreset='custom';delete state.rangeStart;delete state.rangeEnd}renderModelStats(project,kind)});
 root.querySelectorAll('[data-date-preset]').forEach(button=>button.onclick=()=>{const preset=button.dataset.datePreset;if(preset==='custom'){state.datePreset='custom';delete state.rangeStart;delete state.rangeEnd}else modelApplyDatePreset(state,preset);renderModelStats(project,kind);if(preset==='custom')root.querySelector('[data-stat=from]').focus()});
 root.querySelector('[data-stat-reset]').onclick=()=>{const view=state.view;delete statisticsState[project.id];const reset=modelApplyDatePreset({person:'all',plan:'all',api:'all',node:'all',period:'day',dimension:'task',view,expandedPeople:[]},'today');statisticsState[project.id]=reset;renderModelStats(project,kind)};
 root.querySelectorAll('[data-stat-result]').forEach(b=>b.onclick=()=>modelCallDetails(project,{...state,result:b.dataset.statResult||undefined},undefined,kind));
 root.querySelectorAll('[data-run-detail]').forEach(b=>b.onclick=()=>{const next={...state,person:b.dataset.person||state.person,node:b.dataset.node||state.node,result:b.dataset.result||state.result};modelCallDetails(project,next,undefined,kind)});
 root.querySelectorAll('[data-run-expand]').forEach(b=>b.onclick=()=>{const person=b.dataset.runExpand,detail=b.closest('tr')?.nextElementSibling,open=b.getAttribute('aria-expanded')!=='true';if(open&&!state.expandedPeople.includes(person))state.expandedPeople.push(person);if(!open)state.expandedPeople=state.expandedPeople.filter(value=>value!==person);b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',`${open?'收起':'展开'}${person}的节点统计`);if(detail?.matches('[data-person-detail]'))detail.hidden=!open});
 root.querySelectorAll('[data-stat-person]').forEach(b=>b.onclick=()=>{state.person=b.dataset.statPerson;renderModelStats(project,kind);modelCallDetails(project,state,state.person,kind)});
 root.querySelectorAll('[data-metric-detail]').forEach(b=>b.onclick=()=>{
  const [person,type]=b.dataset.metricDetail.split('|'),byPlan=x=>state.plan==='all'||x.planId===state.plan,end=state.to||'9999-12-31';let body='';
  if(type==='works')body=modelTable(['作品编号','作品名称','保存时间'],(project.works||[]).filter(w=>w.creator===person&&byPlan(w)&&modelInPeriod(w.createdAt,state)).map(w=>[escapeHtml(w.id),escapeHtml(w.name),modelTime(w.createdAt)]));
  else {
   const status=t=>t.completedAt&&modelDate(t.completedAt)<=end?'已完成':t.status==='terminated'&&(!t.terminatedAt||modelDate(t.terminatedAt)<=end)?'已终止':'进行中';
   const rows=(project.metricTasks||[]).filter(t=>t.person===person&&byPlan(t)&&modelInPeriod(t.assignedAt,state)).filter(t=>type==='active'?status(t)==='进行中':type==='completed'?status(t)==='已完成':true);
   body=modelTable(['任务编号','人员','分配时间','完成时间','期末状态'],rows.map(t=>[escapeHtml(t.id),escapeHtml(t.person),modelTime(t.assignedAt),status(t)==='已完成'?modelTime(t.completedAt):'—',status(t)]));
  }
  modelDialog('计算明细 · '+person,`<p>建议口径演示；关闭后保留筛选。按统计期间分配的同一批任务统计期末状态，任务完成率 = 已完成任务数 ÷ 已分配任务数。</p>${body}`);
 });
}
const modelOriginalDetail=renderProjectDetail;
renderProjectDetail=function(){const p=modelProject();if(!p)return;modelOriginalDetail();document.querySelector('#projectDetailDescription').textContent=`客户：${p.customer||'未填写'}　　负责人：${p.owner||'未填写'}`;renderModelStats(p,'consumption');renderModelStats(p,'efficiency')};
renderProjectEfficiency=function(){};
const modelOriginalTab=setProjectDetailTab;
setProjectDetailTab=function(name,focus=false){if(name==='works')name='runs';if(['consumption','efficiency'].includes(name))renderModelStats(modelProject(),name);modelOriginalTab(name,focus)};
document.querySelector('#projectDetailPage').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const p=modelProject();if(b.hasAttribute('data-model-runs')){currentProjectWorksPlan=b.dataset.modelRuns;selectedProjectWorkIds.clear();renderProjectWorks(p);setProjectDetailTab('runs',true)}if(b.hasAttribute('data-model-resources'))showResources(p,p.runs.find(r=>r.id===b.dataset.modelResources));if(b.hasAttribute('data-model-compose'))showComposer(p);if(b.hasAttribute('data-model-work'))showFormalWork(p,p.works.find(w=>w.id===b.dataset.modelWork));if(b.hasAttribute('data-model-assign')){selectedProjectWorkIds=new Set([b.dataset.modelAssign]);openProjectWorkAssignmentDialog()}});
// Enforce immutable completed-node history when maintaining node personnel.
const modelOriginalAssignment=openProjectWorkAssignmentDialog;
openProjectWorkAssignmentDialog=function(){const p=modelProject();p.runs.filter(modelDone).forEach(r=>selectedProjectWorkIds.delete(String(r.id)));modelOriginalAssignment();if(!activeProjectWorkAssignment)return;projectWorkAssignmentNodeList.querySelectorAll('[data-node-assignee]').forEach(select=>{const completed=activeProjectWorkAssignment.works.some(run=>productionTasks.some(t=>t.projectId===p.id&&t.workId===run.id&&t.nodeId===select.dataset.nodeAssignee&&t.status==='completed'));if(completed){select.disabled=true;select.required=false;select.value='__mixed__';if(!select.value){select.add(new Option('已完成节点，保留历史人员','__mixed__',true,true))}select.closest('article').title='已完成节点不可修改'}})};
// Custom validation messages are shared by single-plan and project creation.
for(const form of [projectBatchForm,projectCreateForm]){form.noValidate=true;form.addEventListener('submit',()=>queueMicrotask(()=>modelPersist()))}
window.addEventListener('beforeunload',modelPersist);
projectWorksGrid.setAttribute('aria-label','生产运行列表');
document.querySelector('.project-works-mobile-select span').textContent='全选未完成运行';
const projectRunStatisticsSection=document.createElement('section');projectRunStatisticsSection.id='projectRunStatisticsSection';projectRunStatisticsSection.className='project-run-statistics-section';projectRunStatisticsSection.setAttribute('aria-label','项目统计');const projectRunStatisticsFilter=document.createElement('div');projectRunStatisticsFilter.className='project-run-statistics-filter';projectRunStatisticsFilter.append(projectWorksPlanFilter.closest('.project-works-filter'));const projectRunStatistics=document.createElement('div');projectRunStatistics.id='projectRunStatisticsCards';projectRunStatistics.className='project-statistics';projectRunStatisticsSection.append(projectRunStatisticsFilter,projectRunStatistics);document.querySelector('#projectWorksPanel').prepend(projectRunStatisticsSection);renderProjectRunStatistics(modelProject());
renderProjects();
ensureAssignedProductionTasks=function(project,runs){let created=0;for(const run of runs){if(modelDone(run)||run.status==='已终止')continue;const context=resolveTaskWorkflowContext(project,run);if(!context)continue;const tasks=productionTasks.filter(t=>t.projectId===project.id&&String(t.workId)===String(run.id));let active=tasks.find(t=>t.status==='in_progress');if(active){const node=context.snapshot.nodes.find(n=>n.id===active.nodeId),assignee=taskAssigneeForNode(context,node);if(assignee.id){active.assigneeId=assignee.id;active.assigneeName=assignee.name}continue}const index=run.waitingNodeIndex??(tasks.length?Math.max(...tasks.map(t=>t.nodeIndex))+1:0),node=context.snapshot.nodes[index];if(!node)continue;if(!taskAssigneeForNode(context,node).id){run.stage='等待人员分配';run.waitingNodeIndex=index;continue}active=createProductionTask(context,node,index,'in_progress');active.assignmentCreated=true;productionTasks.push(active);run.startedAt||=new Date().toISOString();run.stage=node.title;delete run.waitingNodeIndex;created++}return created};
startProductionPlanTasks=function(project,runs){const n=ensureAssignedProductionTasks(project,runs);syncProjectPlanProductionProgress(project);persistProductionTasks();return n};
const modelAdvance=advanceProductionTask;
advanceProductionTask=function(task,outcome){const before=task.status,context=taskContextByTask(task);modelAdvance(task,outcome);if(!context||before!=='in_progress'||task.status!=='completed')return;const {project,work:run}=context;
 project.metricTasks||=[];if(!project.metricTasks.some(t=>t.id===task.id))project.metricTasks.push({id:task.id,person:task.actualSubmitter||task.assigneeName,assignedAt:new Date(task.createdAt||Date.now()).toISOString(),completedAt:task.completedAt,planId:task.planId,runId:run.id,firstReview:'未审核'});
 if(task.selectedOutput){const out=task.selectedOutput;run.resources||=[];const version=run.resources.filter(r=>r.node===task.nodeTitle).length+1;run.resources.push({id:`${task.id}-V${version}`,kind:out.type==='lyrics'?'歌词':'音频',version:`V${version}`,node:task.nodeTitle,runId:run.id,planId:run.planId,...(out.type==='lyrics'?{content:out.content||task.selectedCandidateText||''}:{url:'./assets/demo-tone.wav',label:'原型合成试听音（非真实生成歌曲）'})})}
 if(task.reviewResult){const metric=project.metricTasks.find(t=>t.runId===run.id&&t.id===productionTaskId(project,run,{id:task.sourceNodeId}));if(metric&&metric.firstReview==='未审核'){metric.firstReview=task.reviewResult==='rejected'?'未通过':'通过';metric.reviewAt=new Date().toISOString()}}
 if(modelDone(run))run.completedAt||=new Date().toISOString();
 const next=productionTasks.find(t=>t.projectId===project.id&&t.workId===run.id&&t.status==='in_progress');if(next&&!next.assigneeId){run.waitingNodeIndex=next.nodeIndex;run.stage='等待人员分配';productionTasks=productionTasks.filter(t=>t!==next)}persistProductionTasks();modelPersist();renderTaskCenter();
};

projectWorkAssignmentAllMember.addEventListener('change',()=>projectWorkAssignmentNodeList.querySelectorAll('select:disabled').forEach(s=>s.value='__mixed__'));
