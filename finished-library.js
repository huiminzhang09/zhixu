function finishedDate(value){if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleString('zh-CN',{hour12:false})}
function finishedAudioUrl(value){try{const url=new URL(value,location.href);return ['https:','http:','blob:'].includes(url.protocol)?url.href:''}catch{return ''}}
let displayedFinishedWorks=[];
function completeFinishedDisplay(work,index){
  const lyrics=work.lyricsContent||work.lyricsText||(work.lyrics&&!['查看','暂无'].includes(work.lyrics)?work.lyrics:'');
  const audio=work.audioUrl&&finishedAudioUrl(work.audioUrl);
  const missing=!work.name||!lyrics||!audio||!work.singer||finishedDate(work.createdAt)==='—'||finishedDate(work.completedAt)==='—';
  return {...work,name:work.name||`向光而行-${String(index+1).padStart(3,'0')}`,lyricsContent:lyrics||'风吹过城市的窗\n把未说的话送往远方\n沿着星光慢慢走\n每一次出发都有回响\n\n让明天在心底生长\n让晚风轻轻唱\n走过漫长的夜色\n我们终会遇见晨光',audioUrl:audio||'',singer:work.singer||['林音（示例）','陈声（示例）','许晴（示例）'][index%3],createdAt:finishedDate(work.createdAt)!=='—'?work.createdAt:'2026-09-01T09:00:00+08:00',completedAt:finishedDate(work.completedAt)!=='—'?work.completedAt:'2026-09-06T18:40:00+08:00',demo:missing};
}
function renderFinishedLibrary(){
 const team=document.querySelector('.workspace-option.active')?.dataset.workspaceId||'orchestra-studio';
 displayedFinishedWorks=projectData.filter(p=>(p.teamId||'orchestra-studio')===team).flatMap(p=>(p.works||[]));
 document.querySelector('#finishedWorkCount').textContent=`共 ${displayedFinishedWorks.length} 个成品`;
 document.querySelector('#finishedWorkRows').innerHTML=displayedFinishedWorks.map((w,index)=>{const p=projectData.find(p=>p.id===w.projectId),lyrics=w.resources.find(r=>r.kind==='歌词'),audio=w.resources.find(r=>r.kind==='音频');return `<tr><td>${escapeHtml(w.name)}<small>${escapeHtml(w.id)}</small></td><td>${lyrics?`<button type="button" data-finished-lyrics="${index}">查看歌词</button>`:'—'}</td><td>${audio?`<audio controls preload="none" src="${escapeHtml(audio.url)}"></audio>`:'—'}</td><td><button type="button" data-finished-project="${escapeHtml(w.projectId)}">${escapeHtml(p?.title||'—')}</button></td><td>已确认</td><td>${modelTime(w.createdAt)}</td><td>${modelTime(w.createdAt)}</td></tr>`}).join('')||'<tr><td colspan="7">暂无已组合确认的作品</td></tr>';
}
document.querySelector('#finishedWorkRows').addEventListener('click',e=>{const b=e.target.closest('[data-finished-project]');if(b){openProjectDetail(b.dataset.finishedProject);setProjectDetailTab('runs')}});
document.querySelector('#finishedWorkRows').addEventListener('click',event=>{
  const button=event.target.closest('[data-finished-lyrics]');if(!button)return;
  const work=displayedFinishedWorks[Number(button.dataset.finishedLyrics)];if(!work)return;
  const dialog=document.createElement('dialog');dialog.className='reference-picker';
  dialog.innerHTML='<form method="dialog"><header><h2>成品歌词</h2><button aria-label="关闭">×</button></header><textarea readonly aria-label="成品歌词内容"></textarea></form>';
  dialog.querySelector('textarea').value=work.resources.find(r=>r.kind==='歌词')?.content||'';
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
});
new MutationObserver(()=>{renderFinishedLibrary();if(!document.querySelector('#assetsPage.active'))document.querySelectorAll('#assetFinishedPanel audio').forEach(audio=>audio.pause())}).observe(document.querySelector('#assetsPage'),{attributes:true,attributeFilter:['class']});
document.querySelectorAll('.workspace-option').forEach(button=>button.addEventListener('click',renderFinishedLibrary));
renderFinishedLibrary();
