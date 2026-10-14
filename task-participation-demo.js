/* Three repeatable examples: manual, automatic, and returned for rework. */
(()=>{
 function initializeParticipationDemos(){
 const project=projectData.find(p=>p.id==='orchestra-theme-album');if(!project)return;
 const member=projectAssignableMembers(project)[0];if(!member)return;
 const seedTime=Date.now();
 ['DEMO-ALLOCATION-009','DEMO-ALLOCATION-010','DEMO-ALLOCATION-008'].forEach((id,index)=>{
  const run=project.runs.find(r=>r.id===id);if(!run||modelDone(run))return;
  const context=resolveTaskWorkflowContext(project,run),node=context?.snapshot?.nodes[0];if(!node)return;
  const taskId=productionTaskId(project,run,node);
  run.nodeAssignments||={};run.nodeAssignments[projectWorkAssignmentKey(context,node.id)]={workflowId:context.plan.workflowId,workflowVersion:context.plan.workflowVersion,nodeId:node.id,nodeName:node.title,memberId:member.id,memberName:member.name,assignedAt:Date.now()};
  let task=productionTasks.find(task=>task.id===taskId);
  if(!task){task=createProductionTask(context,node,0,'in_progress');productionTasks.push(task)}
  if(index===2)run.name='被打回示例';
  Object.assign(task,{workName:projectWorkName(project,run),status:'in_progress',requiresHuman:index!==1,executionMode:index===1?'automatic':'manual',participationDemo:true,assignmentCreated:true,executionCount:index===2?2:1,updatedAt:seedTime+3-index});
  if(index===2)task.returnNote={remark:'副歌情绪不够突出，部分歌词与参考主题不一致。请调整副歌表达，并检查韵脚后重新提交。',fromNodeId:context.snapshot.nodes[1]?.id||node.id,fromNodeTitle:context.snapshot.nodes[1]?.title||node.title,returnedAt:new Date(seedTime).toISOString()};
  else delete task.returnNote;
  run.stage=node.title;run.startedAt||=new Date().toISOString();delete run.waitingNodeIndex;
 });
 persistProductionTasks();persistProjectWorkAssignments();modelPersist();renderTaskCenter();
 }
 // All examples use the same node workspace.
 if(document.readyState==='complete')initializeParticipationDemos();
 else window.addEventListener('load',initializeParticipationDemos,{once:true});
})();
