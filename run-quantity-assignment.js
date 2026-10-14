/* Allocate selected runs by count, preserving completed node ownership. */
(()=>{
 const trigger=document.querySelector('#quickAssignProjectWorks');
 const dialog=document.createElement('dialog');dialog.className='run-allocation-dialog';dialog.setAttribute('aria-labelledby','runAllocationTitle');
 dialog.innerHTML=`<form novalidate><header><h2 id="runAllocationTitle">快捷分配</h2><button type="button" data-close aria-label="关闭">×</button></header><p class="allocation-scope-notice" role="note">选择数量会应用于所有的节点</p><p class="allocation-description">按已选运行的列表顺序分配，每条运行的未完成节点由对应人员执行；已完成节点保留历史人员。已有未完成节点的分配将更新。</p><div class="allocation-summary" aria-live="polite"></div><div class="allocation-column-head"><span>人员</span><span>运行数量</span><span>操作</span></div><div class="allocation-rows"></div><button type="button" data-add>＋ 添加人员</button><section class="allocation-preview"><h3>分配预览</h3><div></div></section><p class="allocation-error" role="alert"></p><footer><button type="button" data-close>取消</button><button type="submit" class="allocation-submit">确认分配</button></footer></form>`;
 document.body.append(dialog);const q=s=>dialog.querySelector(s);let project,contexts,members;
 function rows(){return [...dialog.querySelectorAll('.allocation-row')].map(row=>({row,member:members.find(m=>m.id===row.querySelector('select').value),count:Number(row.querySelector('input').value)}))}
 function update(){
  const allocations=rows(),total=allocations.reduce((n,item)=>n+(Number.isSafeInteger(item.count)&&item.count>0?item.count:0),0);
  q('.allocation-summary').textContent=`已选择 ${contexts.length} 条运行 · 已分配 ${total} 条 · ${total>contexts.length?'超出':'剩余'} ${Math.abs(contexts.length-total)} 条`;
  let offset=0;const preview=q('.allocation-preview > div');preview.replaceChildren();
  allocations.forEach(item=>{if(!item.member||!Number.isSafeInteger(item.count)||item.count<=0)return;const selected=contexts.slice(offset,offset+item.count);offset+=item.count;const p=document.createElement('p');p.textContent=`${item.member.name}：${selected.map(c=>c.work.serial||c.work.id).join('、')||'无可分配运行'}`;preview.append(p)});
  allocations.forEach(item=>{item.row.querySelector('[data-remove]').disabled=allocations.length===1});
  q('[data-add]').disabled=allocations.length>=Math.min(members.length,contexts.length);
  q('.allocation-error').textContent='';
 }
 function addRow(){
  const row=document.createElement('div');row.className='allocation-row';
  row.innerHTML=`<select aria-label="选择人员"><option value="">请选择人员</option>${members.map(m=>`<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)} · ${escapeHtml(m.role)}</option>`).join('')}</select><input type="number" min="1" max="${contexts.length}" step="1" placeholder="运行数量" aria-label="分配运行数量"><button type="button" data-remove>删除</button>`;
  q('.allocation-rows').append(row);row.querySelector('[data-remove]').onclick=()=>{row.remove();update()};update();
 }
 trigger.addEventListener('click',event=>{
  event.preventDefault();project=modelProject();
  const runs=selectedProjectWorks(project).filter(run=>!modelDone(run)&&run.status!=='已终止');
  if(!runs.length){showToast('请先勾选需要分配的进行中运行','error');return}
  contexts=runs.map(run=>projectWorkAssignmentContext(project,run));
  if(contexts.some(c=>!c?.snapshot?.nodes?.length)){showToast('部分运行缺少已发布工作流节点，暂无法分配','error');return}
  members=projectAssignableMembers(project);if(!members.length){showToast('当前项目暂无可分配人员','error');return}
  q('.allocation-rows').replaceChildren();addRow();q('.allocation-row input').value=contexts.length;update();dialog.showModal();
 });
 q('[data-add]').onclick=()=>{addRow();q('.allocation-rows').lastElementChild.querySelector('select').focus()};
 dialog.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>dialog.close());dialog.addEventListener('close',()=>trigger.focus());
 q('.allocation-rows').addEventListener('input',update);q('.allocation-rows').addEventListener('change',update);
 q('form').addEventListener('submit',event=>{
  event.preventDefault();const allocations=rows(),fail=text=>{q('.allocation-error').textContent=text};
  if(allocations.some(a=>!a.member))return fail('请为每一行选择人员。');
  if(new Set(allocations.map(a=>a.member.id)).size!==allocations.length)return fail('同一人员请合并为一行填写。');
  if(allocations.some(a=>!Number.isSafeInteger(a.count)||a.count<=0))return fail('运行数量须为大于零的整数。');
  if(allocations.reduce((n,a)=>n+a.count,0)!==contexts.length)return fail(`分配数量合计须等于已选择的 ${contexts.length} 条运行。`);
  if(contexts.some(c=>modelDone(c.work)||c.work.status==='已终止'))return fail('运行状态已变化，请关闭窗口后重新选择。');
  const savedRuns=contexts.map(c=>({work:c.work,state:JSON.parse(JSON.stringify(c.work))})),savedTasks=JSON.parse(JSON.stringify(productionTasks));
  let oldAssignment;
  try{oldAssignment=localStorage.getItem(projectWorkAssignmentStorageKey)}catch{return fail('无法读取分配记录，请允许本地存储后重试。')}
  try{
   let offset=0;const assignedAt=Date.now();
   allocations.forEach(({member,count})=>{
    contexts.slice(offset,offset+count).forEach(context=>{
     const run=context.work;run.nodeAssignments||={};
     context.snapshot.nodes.forEach(node=>{
      const complete=productionTasks.some(t=>t.projectId===project.id&&String(t.workId)===String(run.id)&&t.nodeId===node.id&&t.status==='completed');
      if(complete)return;
      run.nodeAssignments[projectWorkAssignmentKey(context,node.id)]={workflowId:context.plan.workflowId,workflowVersion:context.plan.workflowVersion,nodeId:node.id,nodeName:node.title,memberId:member.id,memberName:member.name,assignedAt};
     });
     run.lastAssigneeId=member.id;run.owner=member.name;run.lastAssignmentNode='按运行数量分配';run.updated=new Date().toISOString();
    });offset+=count;
   });
   ensureAssignedProductionTasks(project,contexts.map(c=>c.work));
   if(!persistProjectWorkAssignments()||!persistProductionTasks())throw new Error('save');
  }catch{
   savedRuns.forEach(({work,state})=>{Object.keys(work).forEach(key=>delete work[key]);Object.assign(work,state)});productionTasks=savedTasks;
   try{if(oldAssignment===null)localStorage.removeItem(projectWorkAssignmentStorageKey);else localStorage.setItem(projectWorkAssignmentStorageKey,oldAssignment);persistProductionTasks()}catch{}
   return fail('分配保存失败，请重试。');
  }
  selectedProjectWorkIds.clear();dialog.close();renderProjectWorks(project);renderTaskCenter();showToast(`已将 ${contexts.length} 条运行分配给 ${allocations.length} 位人员`);
 });
})();
