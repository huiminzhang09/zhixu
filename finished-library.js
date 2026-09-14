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
  displayedFinishedWorks=projectData.filter(project=>(project.teamId||'orchestra-studio')===team).flatMap(project=>project.works||[]).filter(work=>work.status==='已完成').map(completeFinishedDisplay);
  document.querySelector('#finishedWorkCount').textContent=`共 ${displayedFinishedWorks.length} 个成品`;
  document.querySelector('#finishedWorkRows').innerHTML=displayedFinishedWorks.map((work,index)=>{
    const lyrics=work.lyricsContent||work.lyricsText||(work.lyrics&&!['查看','暂无'].includes(work.lyrics)?work.lyrics:'');
    const audio=work.audioUrl?finishedAudioUrl(work.audioUrl):'';
    return `<tr><td>${escapeHtml(work.name||`待命名作品-${String(index+1).padStart(3,'0')}`)}${work.demo?'<small class="finished-demo-note">示例补全数据</small>':''}</td><td>${lyrics?`<button type="button" data-finished-lyrics="${index}" title="${escapeHtml(lyrics)}">查看歌词</button>`:'<span class="finished-missing">暂无</span>'}</td><td>${audio?`<audio controls preload="metadata" src="${escapeHtml(audio)}" aria-label="播放 ${escapeHtml(work.name||'成品音频')}"></audio>`:'<span class="finished-missing">暂无音频</span>'}</td><td>${escapeHtml(work.singer||'—')}</td><td><span class="finished-status">已完成</span></td><td>${escapeHtml(finishedDate(work.createdAt))}</td><td>${escapeHtml(finishedDate(work.completedAt))}</td></tr>`;
  }).join('')||'<tr><td colspan="7" class="finished-empty">暂无已完成制作的成品</td></tr>';
}
document.querySelector('#finishedWorkRows').addEventListener('click',event=>{
  const button=event.target.closest('[data-finished-lyrics]');if(!button)return;
  const work=displayedFinishedWorks[Number(button.dataset.finishedLyrics)];if(!work)return;
  const dialog=document.createElement('dialog');dialog.className='reference-picker';
  dialog.innerHTML='<form method="dialog"><header><h2>成品歌词</h2><button aria-label="关闭">×</button></header><textarea readonly aria-label="成品歌词内容"></textarea></form>';
  dialog.querySelector('textarea').value=work.lyricsContent||work.lyricsText||work.lyrics;
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
});
new MutationObserver(()=>{renderFinishedLibrary();if(!document.querySelector('#assetsPage.active'))document.querySelectorAll('#assetFinishedPanel audio').forEach(audio=>audio.pause())}).observe(document.querySelector('#assetsPage'),{attributes:true,attributeFilter:['class']});
document.querySelectorAll('.workspace-option').forEach(button=>button.addEventListener('click',renderFinishedLibrary));
renderFinishedLibrary();
