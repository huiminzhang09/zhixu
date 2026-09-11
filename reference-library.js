// One catalog and work-level association map per team. No task-history counting.
function referenceTeamKey(){return 'orchestra-reference-library-v1:'+ (document.querySelector('.workspace-option.active')?.dataset.workspaceId||'orchestra-studio')}
function readReferenceLibrary(){try{return JSON.parse(localStorage.getItem(referenceTeamKey()))||{songs:[],links:{}}}catch{return {songs:[],links:{}}}}
function writeReferenceLibrary(data){try{localStorage.setItem(referenceTeamKey(),JSON.stringify(data));return true}catch{showToast('保存失败，请检查浏览器存储空间','error');return false}}
function referenceWorkKey(task){return JSON.stringify([task.projectId,task.workId])}
function getWorkReferenceId(task){return readReferenceLibrary().links[referenceWorkKey(task)]}
function getAvailableReferenceSongs(){return readReferenceLibrary().songs.filter(song=>!song.disabled)}
function associateReferenceSong(task,id){const data=readReferenceLibrary();if(!data.songs.some(song=>song.id===id&&!song.disabled))return false;data.links[referenceWorkKey(task)]=id;return writeReferenceLibrary(data)}
function referenceSongStatus(song,data){return song.disabled?'已禁用':Object.values(data.links).includes(song.id)?'已使用':'已入库'}
let referenceStatusFilter='全部';
function renderReferenceLibrary(){
  const panel=document.querySelector('#assetReferencesPanel'),data=readReferenceLibrary();
  panel.classList.add('reference-library-panel');
  const songs=data.songs.filter(song=>referenceStatusFilter==='全部'||referenceSongStatus(song,data)===referenceStatusFilter);
  panel.innerHTML=`<div class="reference-library-toolbar"><span>共 ${songs.length} 首对标歌曲</span><label>状态 <select aria-label="对标歌曲状态" data-reference-filter>${['全部','已入库','已使用','已禁用'].map(status=>`<option ${referenceStatusFilter===status?'selected':''}>${status}</option>`).join('')}</select></label><button type="button" data-reference-add>＋ 批量导入歌单</button></div><div class="reference-library-table"><table><thead><tr><th>歌单 ID</th><th>对标 ID</th><th>歌名</th><th>歌手</th><th>歌词</th><th>风格</th><th>添加时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${songs.map(song=>{const status=referenceSongStatus(song,data);return `<tr><td>${escapeHtml(song.playlistId||'—')}</td><td>${escapeHtml(song.referenceId||song.id)}</td><td>${escapeHtml(song.title)}</td><td>${escapeHtml(song.singer||'—')}</td><td><button class="reference-lyrics-preview" data-reference-view="${escapeHtml(song.id)}" title="${escapeHtml(song.content)}">${escapeHtml(song.content)}</button></td><td>${escapeHtml(song.style||'—')}</td><td>${escapeHtml(new Date(song.createdAt).toLocaleString('zh-CN',{hour12:false}))}</td><td><span class="reference-status ${song.disabled?'disabled':status==='已使用'?'used':'ready'}">${status}</span></td><td><button data-reference-toggle="${escapeHtml(song.id)}">${song.disabled?'启用':'禁用'}</button></td></tr>`}).join('')||'<tr><td colspan="9" class="reference-library-empty">暂无符合条件的对标歌曲</td></tr>'}</tbody></table></div>`;
}
document.querySelector('#assetReferencesPanel').addEventListener('change',event=>{if(event.target.matches('[data-reference-filter]')){referenceStatusFilter=event.target.value;renderReferenceLibrary()}});
document.querySelector('#assetReferencesPanel').addEventListener('click',event=>{
  const data=readReferenceLibrary(),toggle=event.target.closest('[data-reference-toggle]'),view=event.target.closest('[data-reference-view]');
  if(toggle){const song=data.songs.find(item=>item.id===toggle.dataset.referenceToggle);if(!song)return;if(!song.disabled&&Object.values(data.links).includes(song.id)){showToast('该歌曲已被作品使用，请先更换关联对标后再禁用','error');return}song.disabled=!song.disabled;if(writeReferenceLibrary(data)){renderReferenceLibrary();showToast(song.disabled?'已禁用对标歌曲':'已启用，状态为已入库')}return}
  if(view){const song=data.songs.find(item=>item.id===view.dataset.referenceView);if(song)openReferenceSongDialog(song);return}
  if(event.target.closest('[data-reference-add]'))openReferenceSongDialog();
});
function openReferenceSongDialog(song){
  if(!song){openPlaylistImportDialog();return}
  const dialog=document.createElement('dialog');dialog.className='reference-picker';
  dialog.innerHTML=`<form><header><h2>${song?'对标歌词':'新增对标歌曲'}</h2><button type="button" data-close aria-label="关闭">×</button></header><label>歌名${song?'':' *'}<input name="title" maxlength="100" required ${song?'readonly':''}></label><label>歌手${song?'':' *'}<input name="singer" maxlength="100" required ${song?'readonly':''}></label><label>歌词${song?'':' *'}<textarea name="content" required ${song?'readonly':''}></textarea></label><footer><button type="button" data-close>关闭</button>${song?'':'<button type="submit" class="reference-confirm">确认入库</button>'}</footer></form>`;
  if(song)for(const field of ['title','singer','content'])dialog.querySelector(`[name="${field}"]`).value=song[field];
  dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();if(song)return;const fields=Object.fromEntries(new FormData(event.target));for(const key of ['title','singer','content']){fields[key]=fields[key].trim();if(!fields[key]){event.target.elements[key].focus();return}}const data=readReferenceLibrary();data.songs.unshift({...fields,id:crypto.randomUUID(),createdAt:new Date().toISOString(),disabled:false});if(writeReferenceLibrary(data)){dialog.close();renderReferenceLibrary();showToast('对标歌曲已入库')}});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
}
// Read saved association even when the demo task resets to step one on refresh.
const referenceTaskObserver=new MutationObserver(()=>{
  const task=productionTasks.find(item=>item.id===selectedTaskId),field=document.querySelector('.ref-reference-lyrics textarea');
  if(!task||!field)return;const data=readReferenceLibrary(),song=data.songs.find(item=>item.id===data.links[referenceWorkKey(task)]);
  if(song){field.value=song.content;field.title=song.content;task.formValues={...task.formValues,referenceLyrics:song.content,referenceTitle:song.title}}
});
referenceTaskObserver.observe(document.querySelector('#taskDetailPanel')||taskDetailPanel,{childList:true,subtree:true});
new MutationObserver(renderReferenceLibrary).observe(document.querySelector('#assetsPage'),{attributes:true,attributeFilter:['class']});
document.querySelectorAll('.workspace-option').forEach(option=>option.addEventListener('click',renderReferenceLibrary));
renderReferenceLibrary();
