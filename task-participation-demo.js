/* Repeatable examples: manual, automatic, returned, and reference-song generation. */
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
 // An additional card demonstrates several returns without replacing the single-return example.
 const returnedRun=project.runs.find(run=>run.id==='DEMO-ALLOCATION-006');
 const returnedContext=returnedRun&&resolveTaskWorkflowContext(project,returnedRun),returnedNode=returnedContext?.snapshot.nodes[0];
 if(returnedNode&&!modelDone(returnedRun)){
  returnedRun.name='多次打回示例';returnedRun.nodeAssignments||={};
  returnedRun.nodeAssignments[projectWorkAssignmentKey(returnedContext,returnedNode.id)]={workflowId:returnedContext.plan.workflowId,workflowVersion:returnedContext.plan.workflowVersion,nodeId:returnedNode.id,nodeName:returnedNode.title,memberId:member.id,memberName:member.name,assignedAt:seedTime};
  const id=productionTaskId(project,returnedRun,returnedNode);
  let task=productionTasks.find(item=>item.id===id);
  if(!task){task=createProductionTask(returnedContext,returnedNode,0,'in_progress');productionTasks.push(task)}
  let history=taskReturnRecords(task);
  if(!history.length)history=[
   '主歌内容与参考主题不一致，请围绕“重逢”重新调整歌词。',
   '副歌韵脚不统一，部分句子过长，请统一韵脚并精简句子。',
   '副歌情绪仍不够突出，请增强情绪递进，并保留已确认的主歌内容。'
  ].map((remark,index)=>({id:`multiple-return-demo-${index+1}`,remark,fromNodeId:returnedContext.snapshot.nodes[1]?.id||returnedNode.id,fromNodeTitle:returnedContext.snapshot.nodes[1]?.title||returnedNode.title,toNodeId:returnedNode.id,toNodeTitle:returnedNode.title,returnedAt:new Date(seedTime-(3-index)*40*60*1000).toISOString()}));
  Object.assign(task,{workName:returnedRun.name,status:'in_progress',requiresHuman:true,executionMode:'manual',participationDemo:true,assignmentCreated:true,returnHistory:history,returnNote:history[history.length-1],executionCount:Math.max(history.length+1,Number(task.executionCount)||1),updatedAt:seedTime+5,updatedLabel:'刚刚'});
  returnedRun.status='制作中';returnedRun.stage=returnedNode.title;returnedRun.startedAt||=new Date(seedTime).toISOString();delete returnedRun.waitingNodeIndex;
 }
 // Reuse one pending example run, keeping its workflow and production number intact.
 const songRun=project.runs.find(run=>run.id==='DEMO-ALLOCATION-007');
 const songContext=songRun&&resolveTaskWorkflowContext(project,songRun);
 const songIndex=songContext?.snapshot.nodes.findIndex(node=>node.type==='refSong')??-1;
 if(songContext&&songIndex>=0&&window.orchestraReferenceSongTask&&!modelDone(songRun)){
  songRun.name='基于参考生成歌曲示例';songRun.referenceSongDemo=true;
  songRun.nodeAssignments||={};
  songContext.snapshot.nodes.slice(0,songIndex+2).forEach(node=>{
   songRun.nodeAssignments[projectWorkAssignmentKey(songContext,node.id)]={workflowId:songContext.plan.workflowId,workflowVersion:songContext.plan.workflowVersion,nodeId:node.id,nodeName:node.title,memberId:member.id,memberName:member.name,assignedAt:seedTime};
  });
  productionTasks=productionTasks.filter(task=>task.projectId!==project.id||String(task.workId)!==String(songRun.id));
  songContext.snapshot.nodes.slice(0,songIndex+1).forEach((node,index)=>{
   const task=createProductionTask(songContext,node,index,index===songIndex?'in_progress':'completed',seedTime-1000+index);
   Object.assign(task,{assignmentCreated:true,updatedAt:index===songIndex?seedTime+4:seedTime-1000+index,updatedLabel:'刚刚'});
   if(index===songIndex)Object.assign(task,{nodeTitle:'基于参考生成歌曲',referenceSongDemo:true,requiresHuman:true,executionMode:'manual',generationStage:'generated',formValues:{lyrics:window.orchestraReferenceSongTask.lyrics,count:'2'},candidates:window.orchestraReferenceSongTask.candidates()});
   else{
    task.completedAt=new Date(seedTime-1000+index).toISOString();task.actualSubmitter=member.name;
    if(node.type==='refLyrics')Object.assign(task,{selectedCandidateId:'reference-song-lyrics',selectedCandidateText:window.orchestraReferenceSongTask.lyrics,selectedOutput:{type:'lyrics',candidateId:'reference-song-lyrics',content:window.orchestraReferenceSongTask.lyrics}});
    if(node.type==='lyricsReview')task.reviewResult='approved';
   }
   productionTasks.push(task);
  });
  songRun.status='制作中';songRun.stage='基于参考生成歌曲';songRun.startedAt||=new Date(seedTime).toISOString();delete songRun.waitingNodeIndex;
 }
 persistProductionTasks();persistProjectWorkAssignments();modelPersist();renderTaskCenter();
 }
 // Initialize after the task center so each example keeps its node state.
 if(document.readyState==='complete')initializeParticipationDemos();
 else window.addEventListener('load',initializeParticipationDemos,{once:true});
})();
