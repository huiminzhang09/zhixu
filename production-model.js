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
const modelTable=(headers,rows)=>`<div class="model-table-scroll"><table class="model-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map(c=>`<td>${c??'—'}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="model-empty">暂无符合条件的记录</td></tr>`}</tbody></table></div>`;
let formalPlanFilter='all';
const statisticsState={};
function modelPersist(){try{localStorage.setItem(productionModelKey,JSON.stringify(projectData));return true}catch{showToast('保存失败，请检查浏览器存储空间','error');return false}}
function modelDialog(title,html){const d=document.createElement('dialog');d.className='model-dialog';d.innerHTML=`<header><h2>${escapeHtml(title)}</h2><button type="button" data-close aria-label="关闭">×</button></header>${html}`;d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>{d.querySelectorAll('audio').forEach(a=>a.pause());d.remove()});document.body.append(d);d.showModal();return d}
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

syncProjectPlanProductionProgress=function(project){for(const plan of project.batches){const runs=(project.runs||[]).filter(r=>r.planId===plan.id);plan.completed=new Set(runs.filter(modelDone).map(r=>r.id)).size;plan.productionStatus=plan.completed===Number(plan.quantity)&&runs.length===Number(plan.quantity)?'已完成':'生产中';plan.status=plan.productionStatus}};
renderProjectPlans=function(project){syncProjectPlanProductionProgress(project);const plans=project.batches||[];projectPlanList.innerHTML=modelTable(['计划名称','计划运行次数','已完成运行次数','实际作品数','状态','工作流及版本','交付日期','备注','操作'],plans.map(p=>[escapeHtml(p.name),p.quantity,p.completed,(project.works||[]).filter(w=>w.planId===p.id).length,`<span class="model-status">${p.status}</span>`,escapeHtml(`${p.workflowName} ${p.workflowVersion}`),escapeHtml(p.delivery||'—'),escapeHtml(richTextPlainText(p.notes)||'—'),modelButton('data-model-runs',p.id,'查看运行')]));projectPlanTableWrap.hidden=!plans.length;projectPlanEmpty.hidden=!!plans.length};
projectWorkRow=function(run,index,map,project){const plan=project.batches.find(p=>p.id===run.planId);return `<div class="project-work-row" data-work-row="${escapeHtml(run.id)}"><div><input type="checkbox" data-work-select="${escapeHtml(run.id)}" aria-label="选择运行 ${escapeHtml(run.serial)}" ${selectedProjectWorkIds.has(String(run.id))?'checked':''} ${modelDone(run)?'disabled':''}></div><div>${escapeHtml(run.serial)}</div><div>${escapeHtml(map.get(run.planId)||'—')}</div><div>${escapeHtml(`${plan?.workflowName||'—'} ${plan?.workflowVersion||''}`)}</div><div>${modelDone(run)?'已完成':escapeHtml(run.status==='制作中'?'进行中':run.status)}</div><div>${modelDone(run)?'—':escapeHtml(run.stage||'等待分配')}</div><div>${escapeHtml(run.demoOwner?`${run.demoOwner}（示例）`:'待确认')}</div><div>${modelTime(run.startedAt)}</div><div>${modelTime(run.completedAt)}</div><div>${(project.works||[]).filter(w=>w.runId===run.id).length}</div><div>${modelDone(run)?modelButton('data-model-resources',run.id,'查看资源'):modelButton('data-model-assign',run.id,'分配人员')}</div></div>`};
const legacyRenderRuns=renderProjectWorks;
renderProjectWorks=function(project){legacyRenderRuns(project);const head=projectWorksGrid.querySelector('.head');head.innerHTML='<div><input type="checkbox" data-work-select-all aria-label="全选未完成运行"></div>'+['运行编号','所属计划','工作流及版本','状态','当前节点','负责人¹','开始时间','结束时间','关联作品数','操作'].map(s=>`<span>${s}</span>`).join('');syncProjectWorkSelectionUI(visibleProjectWorks(project));};
const oldVisibleSelection=setVisibleProjectWorksSelection;
setVisibleProjectWorksSelection=function(checked){oldVisibleSelection(checked);const p=modelProject();p.runs.filter(modelDone).forEach(r=>selectedProjectWorkIds.delete(String(r.id)));renderProjectWorks(p)};
function showFormalWork(project,work){const d=modelDialog('作品详情 · 资源追溯',`<p>${escapeHtml(work.id)} · 来源运行 ${escapeHtml(work.runId)}</p><label>作品名称 <input id="formalName" maxlength="100" value="${escapeHtml(work.name)}"></label><button type="button" id="saveFormalName">保存名称</button><p>创建人：${escapeHtml(work.creator)} · ${modelTime(work.createdAt)}</p>${work.resources.map(r=>`<article class="model-resource"><b>${escapeHtml(r.kind)} · ${escapeHtml(r.version)}</b><small>${escapeHtml(r.id)} · 来源运行 ${escapeHtml(r.runId)} · 节点 ${escapeHtml(r.node)}</small>${r.kind==='歌词'?`<pre>${escapeHtml(r.content)}</pre>`:`<audio controls src="${escapeHtml(r.url)}"></audio>`}</article>`).join('')}`);d.querySelector('#saveFormalName').onclick=()=>{const input=d.querySelector('#formalName'),name=input.value.trim();if(!name){input.setCustomValidity('请输入作品名称');input.reportValidity();return}const old=work.name;work.name=name;if(!modelPersist()){work.name=old;return}renderProjectDetail();if(typeof renderFinishedLibrary==='function')renderFinishedLibrary();d.close();showToast('作品名称已更新，作品数不变')}}
function modelApplyDatePreset(state,preset,now=new Date()){
 const today=modelDate(now);state.datePreset=preset;state.to=today;
 if(preset==='seven'){state.rangeStart=now.getTime()-7*24*60*60*1000;state.rangeEnd=now.getTime();state.from=modelDate(state.rangeStart)}
 else {state.from=preset==='month'?today.slice(0,7)+'-01':today;state.rangeStart=new Date(state.from+'T00:00:00+08:00').getTime();state.rangeEnd=now.getTime()}
 return state;
}
function modelStatsState(project){return statisticsState[project.id]||=modelApplyDatePreset({person:'all',plan:'all',api:'all',period:'day',dimension:'task'},'today')}
function modelInPeriod(value,state){
 if(!value)return false;const timestamp=new Date(value).getTime();if(!Number.isFinite(timestamp))return false;
 if(state.datePreset&&state.datePreset!=='custom')return timestamp>=state.rangeStart&&timestamp<=state.rangeEnd;
 const date=modelDate(value);return (!state.from||date>=state.from)&&(!state.to||date<=state.to);
}
function modelFilteredCalls(project,state){const seen=new Set();return (project.calls||[]).filter(c=>{if(seen.has(c.id))return false;seen.add(c.id);return modelInPeriod(c.start,state)&&(state.person==='all'||c.person===state.person)&&(state.plan==='all'||c.planId===state.plan)&&(state.api==='all'||c.api===state.api)&&(!state.result||c.result===state.result)})}
function modelPeriod(value,period){const day=modelDate(value);if(period==='month')return day.slice(0,7);if(period==='week'){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10)+' 周'}return day}
function modelStatsFilters(project,state,kind){const options=(values,current)=>'<option value="all">全部</option>'+values.map(v=>`<option value="${escapeHtml(v)}" ${current===v?'selected':''}>${escapeHtml(v)}</option>`).join('');return `<div class="model-toolbar model-filters">${`<div class="model-date-presets" role="group" aria-label="查询时间">${[['today','当前'],['seven','近七天'],['month','本月']].map(([value,label])=>`<button type="button" data-date-preset="${value}" aria-pressed="${state.datePreset===value}" class="${state.datePreset===value?'active':''}">${label}</button>`).join('')}</div>`}<label>开始日期 <input type="date" data-stat="from" value="${state.from}"></label><label>结束日期 <input type="date" data-stat="to" value="${state.to}"></label><label>人员 <select data-stat="person">${options([...new Set([...(project.calls||[]).map(c=>c.person),...(project.works||[]).map(w=>w.creator)])],state.person)}</select></label><label>计划 <select data-stat="plan"><option value="all">全部</option>${project.batches.map(p=>`<option value="${escapeHtml(p.id)}" ${state.plan===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></label><label>接口 <select data-stat="api">${options([...new Set((project.calls||[]).map(c=>c.api))],state.api)}</select></label>${kind==='efficiency'?`<label>统计维度 <select data-stat="dimension">${[['task','任务'],['flow','流水']].map(([v,l])=>`<option value="${v}" ${state.dimension===v?'selected':''}>${l}</option>`).join('')}</select></label>`:''}<button type="button" data-stat-reset>重置</button></div>`}
function modelCallDetails(project,state,person){const next={...state,...(person?{person}:{})},rows=modelFilteredCalls(project,next);modelDialog('付费接口调用明细',`<p>北京时间 · ${escapeHtml(person||'当前筛选')} · ${rows.length} 次请求；关闭后保留原筛选。</p>`+modelTable(['请求编号','接口','归属人员','开始时间','结束时间','执行结果','工作流及版本','运行编号','节点'],rows.map(c=>[escapeHtml(c.id),escapeHtml(c.api),escapeHtml(c.person),modelTime(c.start),modelTime(c.end),c.result,escapeHtml(c.workflow+' '+c.version),escapeHtml(c.runId),escapeHtml(c.node)])))}
function modelInterfaceConsumption(calls){
 // Consumption comes from metering records, never from request counts.
 if(!calls.length)return '—';
 if(calls.some(c=>typeof c.consumptionAmount!=='number'||!Number.isFinite(c.consumptionAmount)||!c.consumptionUnit))return '<span title="接口消耗数据尚未接入">—</span>';
 const totals=new Map();calls.forEach(c=>totals.set(c.consumptionUnit,(totals.get(c.consumptionUnit)||0)+c.consumptionAmount));
 return [...totals].map(([unit,total])=>`${total.toLocaleString('zh-CN',{maximumFractionDigits:4})} ${escapeHtml(unit)}`).join(' / ');
}
function renderModelStats(project,kind){
 const state=modelStatsState(project),root=document.querySelector(kind==='consumption'?'#consumptionPanel':'#projectEfficiencyPanel'),calls=modelFilteredCalls(project,state);
 let html=modelStatsFilters(project,state,kind);
 if(state.from&&state.to&&state.from>state.to)html+='<p role="alert">开始日期不能晚于结束日期。</p>';
 if(kind==='consumption'){
  html+=`<div class="model-metrics">${[['付费接口调用总次数',calls.length],['成功',calls.filter(c=>c.result==='成功').length],['失败',calls.filter(c=>c.result==='失败').length],['执行中',calls.filter(c=>c.result==='执行中').length]].map(([l,n])=>`<article><small>${l}</small>${`<button type="button" data-stat-result="${l==='付费接口调用总次数'?'':l}">${n}</button>`}</article>`).join('')}</div><p>一次真实请求计一次；真实重试另计；按请求编号去重，重复回调不累计，不等同于实际扣费次数。</p>`;
  const groups=new Map();calls.forEach(c=>{const k=modelPeriod(c.start,state.period);groups.set(k,[...(groups.get(k)||[]),c])});html+=modelTable(['统计周期','调用次数','成功','失败','执行中'],[...groups].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,v.length,...['成功','失败','执行中'].map(s=>v.filter(c=>c.result===s).length)]));
  html+='<h3>人员调用汇总</h3>'+modelTable(['人员','调用次数','接口分布'],[...new Set(calls.map(c=>c.person))].map(person=>{const list=calls.filter(c=>c.person===person);return [modelButton('data-stat-person',person,person),modelButton('data-stat-detail',person,String(list.length)),[...new Set(list.map(c=>c.api))].map(api=>`${escapeHtml(api)}：${list.filter(c=>c.api===api).length}`).join(' / ')]}));html+=modelButton('data-stat-detail','','查看当前筛选调用明细');
 }else{
  const tasks=(project.metricTasks||[]).filter(t=>modelInPeriod(t.assignedAt,state)&&(state.plan==='all'||t.planId===state.plan));
  const people=[...new Set([...tasks.map(t=>t.person),...calls.map(c=>c.person),...(project.works||[]).map(w=>w.creator)])].filter(p=>state.person==='all'||p===state.person);
  html+='<p>按统计期间分配的同一批任务统计期末状态；任务完成率 = 已完成任务数 ÷ 已分配任务数。</p>'+modelTable(['人员','总数量','进行中数量（当前）','已完成数量','完成率','组合创建作品数','付费接口调用次数','接口消耗'],people.map(person=>{
   const cohort=tasks.filter(t=>t.person===person),end=state.to||'9999-12-31',done=cohort.filter(t=>t.completedAt&&modelDate(t.completedAt)<=end),active=cohort.filter(t=>(!t.completedAt||modelDate(t.completedAt)>end)&&!(t.status==='terminated'&&(!t.terminatedAt||modelDate(t.terminatedAt)<=end)));
   const works=(project.works||[]).filter(w=>w.creator===person&&modelInPeriod(w.createdAt,state)&&(state.plan==='all'||w.planId===state.plan));
   const rate=(n,d)=>d?`${(n/d*100).toFixed(1)}%（${n}/${d}）`:'—（分母为 0）';
   return [modelButton('data-stat-person',person,person),modelButton('data-metric-detail',person+'|assigned',String(cohort.length)),modelButton('data-metric-detail',person+'|active',String(active.length)),modelButton('data-metric-detail',person+'|completed',String(done.length)),modelButton('data-metric-detail',person+'|cohort',rate(done.length,cohort.length)),modelButton('data-metric-detail',person+'|works',String(works.length)),modelButton('data-stat-detail',person,String(calls.filter(c=>c.person===person).length)),modelInterfaceConsumption(calls.filter(c=>c.person===person))];
  }));
 }
 root.innerHTML=html;
 root.querySelectorAll('[data-stat]').forEach(el=>el.onchange=()=>{state[el.dataset.stat]=el.value;if(['from','to'].includes(el.dataset.stat)){state.datePreset='custom';delete state.rangeStart;delete state.rangeEnd}renderModelStats(project,kind)});
 root.querySelectorAll('[data-date-preset]').forEach(button=>button.onclick=()=>{const preset=button.dataset.datePreset;if(preset==='custom'){state.datePreset='custom';delete state.rangeStart;delete state.rangeEnd}else modelApplyDatePreset(state,preset);renderModelStats(project,kind);if(preset==='custom')root.querySelector('[data-stat=from]').focus()});
 root.querySelector('[data-stat-reset]').onclick=()=>{delete statisticsState[project.id];renderModelStats(project,kind)};
 root.querySelectorAll('[data-stat-result]').forEach(b=>b.onclick=()=>modelCallDetails(project,{...state,result:b.dataset.statResult}));
 root.querySelectorAll('[data-stat-detail]').forEach(b=>b.onclick=()=>modelCallDetails(project,state,b.dataset.statDetail));
 root.querySelectorAll('[data-stat-person]').forEach(b=>b.onclick=()=>{state.person=b.dataset.statPerson;renderModelStats(project,kind);modelCallDetails(project,state,state.person)});
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
const runNote=document.createElement('p');runNote.className='model-note';runNote.textContent='¹ 运行负责人归属规则待确认。节点人员沿用原执行规则：无分配时等待，分配后生成进行中任务；已完成人工节点保留历史人员。';document.querySelector('#projectWorksPanel').prepend(runNote);
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
